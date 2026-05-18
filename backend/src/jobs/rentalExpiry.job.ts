import { Queue, Worker, QueueEvents } from "bullmq";
import { redisQueue } from "../database/redis.js";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";
import { RentalStatus, NotificationType, NotificationChannel } from "@prisma/client";

/**
 * Rental expiry job.
 *
 * Two responsibilities:
 *  1. Mark rentals whose endsAt has passed as EXPIRED, and end any open
 *     rental sessions.
 *  2. Surface a "rental expiring soon" reminder roughly 1h and 10m before
 *     the end (Plan A.md §3, items 140-141).
 *
 * Implementation: a single repeating job runs every minute. Cheap query
 * over the (status, endsAt) index, all writes batched. If the job ever
 * runs slower than its repeat interval, BullMQ will skip duplicate
 * dispatches automatically.
 */

const QUEUE_NAME = "rental-expiry";
const REPEAT_KEY = "rental-expiry:tick";
const REPEAT_EVERY_MS = 60_000; // every minute

const connection = { connection: redisQueue };

export const rentalExpiryQueue = new Queue(QUEUE_NAME, connection);
export const rentalExpiryEvents = new QueueEvents(QUEUE_NAME, connection);

export const rentalExpiryWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    if (job.name !== "tick") return;
    const now = new Date();

    // 1. Expire rentals whose end is past.
    const expiringIds = await prisma.rental.findMany({
      where: { status: RentalStatus.ACTIVE, endsAt: { lte: now } },
      select: { id: true, userId: true },
      take: 500,
    });

    if (expiringIds.length > 0) {
      const ids = expiringIds.map((r) => r.id);
      await prisma.$transaction([
        prisma.rental.updateMany({
          where: { id: { in: ids } },
          data: { status: RentalStatus.EXPIRED },
        }),
        // Close any rental sessions that are still open
        prisma.rentalSession.updateMany({
          where: { rentalId: { in: ids }, endedAt: null },
          data: { endedAt: now },
        }),
      ]);

      // Best-effort notifications. Failure here doesn't fail the job.
      await prisma.notification.createMany({
        data: expiringIds.map((r) => ({
          userId: r.userId,
          type: NotificationType.RENTAL_EXPIRING,
          channel: NotificationChannel.IN_APP,
          title: "Аренда завершена",
          body: "Срок аренды истёк. Продлите, чтобы продолжить играть.",
        })),
        skipDuplicates: true,
      }).catch((err) =>
        logger.warn({ err: (err as Error).message }, "rental-expiry notifications insert failed"),
      );
    }

    // 2. Schedule a "expiring soon" reminder for rentals ending in
    //    ~1 hour and ~10 minutes. We use a small window (±30s) to
    //    catch the next minute's worth without double-emitting.
    const window = (lead: number) => ({
      gt: new Date(now.getTime() + lead - 30_000),
      lte: new Date(now.getTime() + lead + 30_000),
    });
    const soon = await prisma.rental.findMany({
      where: {
        status: RentalStatus.ACTIVE,
        OR: [
          { endsAt: window(60 * 60_000) },
          { endsAt: window(10 * 60_000) },
        ],
      },
      select: { id: true, userId: true, endsAt: true },
      take: 500,
    });

    if (soon.length > 0) {
      await prisma.notification.createMany({
        data: soon.map((r) => {
          const minutes = Math.round((r.endsAt.getTime() - now.getTime()) / 60_000);
          return {
            userId: r.userId,
            type: NotificationType.RENTAL_EXPIRING,
            channel: NotificationChannel.IN_APP,
            title: "Аренда скоро закончится",
            body: `Осталось примерно ${minutes} мин. Продлите аренду.`,
            payload: { rentalId: r.id, minutesLeft: minutes },
          };
        }),
        skipDuplicates: true,
      });
    }

    return { expired: expiringIds.length, soon: soon.length };
  },
  {
    ...connection,
    concurrency: 1,
    // Don't accumulate completed/failed history forever.
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
);

/**
 * Register the recurring trigger. BullMQ deduplicates by `repeat.jobId`
 * so calling this from every replica is safe.
 */
export async function scheduleRentalExpiryRecurring(): Promise<void> {
  await rentalExpiryQueue.add(
    "tick",
    {},
    {
      repeat: { every: REPEAT_EVERY_MS, key: REPEAT_KEY },
      jobId: REPEAT_KEY,
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
  logger.debug({ src: "jobs", queue: QUEUE_NAME, every: REPEAT_EVERY_MS }, "rental-expiry tick scheduled");
}
