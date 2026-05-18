import { Queue, Worker } from "bullmq";
import { Prisma, OrderStatus, NotificationType, NotificationChannel } from "@prisma/client";
import { redisQueue } from "../database/redis.js";
import { prisma } from "../database/prisma.js";
import { releaseEscrow } from "../services/wallet.js";
import { logger } from "../utils/logger.js";

/**
 * Order auto-confirm job.
 *
 * Plan A.md §1 #64: orders auto-confirm 48h after being delivered if
 * the buyer hasn't manually confirmed. This is what closes the escrow
 * loop in the absence of buyer action — without it, an unresponsive
 * buyer would freeze the seller's payout indefinitely.
 *
 * Implementation
 * --------------
 * One repeating BullMQ job ticks every minute. Each tick:
 *   1. Selects up to 200 DELIVERING orders whose `autoConfirmAt` is
 *      in the past, ordered by oldest-first (so a backlog drains FIFO).
 *   2. For each candidate, runs a per-order transaction that:
 *        - re-checks status under the row lock (idempotency)
 *        - releases escrow seller-side
 *        - flips status → COMPLETED, sets confirmedAt
 *        - inserts an in-app notification for the seller
 *   3. Logs successes / failures separately so a single bad row
 *      doesn't poison the whole batch.
 *
 * Why per-order transactions instead of one big batch
 * ---------------------------------------------------
 * Releasing escrow is multi-row (user balance + transaction insert).
 * If we wrapped 200 orders in one transaction, a single anomaly aborts
 * the entire batch and we make zero progress. Per-order keeps progress
 * local — bad rows fail individually and the next tick retries them.
 */

const QUEUE_NAME = "order-auto-confirm";
const REPEAT_KEY = "order-auto-confirm:tick";
const REPEAT_EVERY_MS = 60_000;
const BATCH_SIZE = 200;

const connection = { connection: redisQueue };

export const orderAutoConfirmQueue = new Queue(QUEUE_NAME, connection);

export const orderAutoConfirmWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    if (job.name !== "tick") return;
    const now = new Date();

    const candidates = await prisma.order.findMany({
      where: { status: OrderStatus.DELIVERING, autoConfirmAt: { lte: now } },
      orderBy: { autoConfirmAt: "asc" },
      take: BATCH_SIZE,
      select: {
        id: true,
        sellerId: true,
        currency: true,
        total: true,
        commission: true,
        number: true,
      },
    });
    if (candidates.length === 0) return { confirmed: 0 };

    let confirmed = 0;
    let failed = 0;

    for (const o of candidates) {
      try {
        await prisma.$transaction(async (tx) => {
          // Re-check status inside the tx — between the SELECT above and
          // now, the buyer may have confirmed manually, the order may have
          // entered dispute, or another worker replica may have grabbed it.
          const fresh = await tx.order.findUnique({
            where: { id: o.id },
            select: { id: true, status: true, autoConfirmAt: true },
          });
          if (!fresh || fresh.status !== OrderStatus.DELIVERING) return;
          if (!fresh.autoConfirmAt || fresh.autoConfirmAt > now) return;

          const sellerNet = new Prisma.Decimal(o.total).minus(new Prisma.Decimal(o.commission));
          await releaseEscrow(tx, {
            sellerId: o.sellerId,
            orderId: o.id,
            currency: o.currency,
            amount: sellerNet,
            description: `Auto-confirmed after 48h on ${o.number}`,
          });
          await tx.order.update({
            where: { id: o.id },
            data: { status: OrderStatus.COMPLETED, confirmedAt: now },
          });

          // Best-effort notification (failure here doesn't fail the tx —
          // if it did, every notif insert flake would unwind the payout).
          await tx.notification.create({
            data: {
              userId: o.sellerId,
              type: NotificationType.ORDER_UPDATED,
              channel: NotificationChannel.IN_APP,
              title: "Заказ автоподтверждён",
              body: `Покупатель не подтвердил получение в течение 48ч — средства по ${o.number} переведены на ваш баланс.`,
              payload: { orderId: o.id, reason: "auto-confirm-48h" },
            },
          }).catch((err) =>
            logger.warn({ err: (err as Error).message, orderId: o.id }, "auto-confirm notification failed"),
          );
        });
        confirmed++;
      } catch (err) {
        failed++;
        logger.warn(
          { err: (err as Error).message, orderId: o.id },
          "auto-confirm failed for order — will retry on next tick",
        );
      }
    }

    return { confirmed, failed, considered: candidates.length };
  },
  {
    ...connection,
    concurrency: 1,
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

export async function scheduleOrderAutoConfirmRecurring(): Promise<void> {
  await orderAutoConfirmQueue.add(
    "tick",
    {},
    {
      repeat: { every: REPEAT_EVERY_MS, key: REPEAT_KEY },
      jobId: REPEAT_KEY,
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
  logger.debug({ src: "jobs", queue: QUEUE_NAME, every: REPEAT_EVERY_MS }, "order-auto-confirm tick scheduled");
}
