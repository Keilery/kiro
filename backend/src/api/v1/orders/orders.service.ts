import {
  Prisma,
  OrderStatus,
  ListingStatus,
  DeliveryMode,
  TransactionType,
} from "@prisma/client";
import { prisma } from "../../../database/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { paginate, buildPage, type Page } from "../../../utils/pagination.js";
import { commissionFor } from "../../../services/commission.js";
import {
  debit,
  freezeForEscrow,
  releaseEscrow,
  refundEscrow,
  recordCommission,
} from "../../../services/wallet.js";
import { logger } from "../../../utils/logger.js";
import type {
  OrderCreateInput,
  OrderListQuery,
  DisputeOpenInput,
  DisputeResolveInput,
} from "./orders.dto.js";

/**
 * Orders service — the marketplace's escrow engine.
 *
 * State machine
 * -------------
 *
 *   PENDING ──pay──▶ PAID ──deliver──▶ DELIVERING ─┬─ confirm ──▶ COMPLETED
 *                                                   ├─ auto-confirm 48h ──▶ COMPLETED
 *                                                   └─ dispute ──▶ DISPUTED
 *
 *   PENDING ──cancel──▶ CANCELLED        (no money has moved)
 *   DISPUTED ──mod refund──▶ REFUNDED    (escrow refunded to buyer)
 *   DISPUTED ──mod release──▶ COMPLETED  (escrow released to seller)
 *
 * Money flow
 * ----------
 * On successful payment we do all of these atomically:
 *   1. Buyer balance -= total           (debit)
 *   2. Seller balanceFrozen += sellerNet (freezeForEscrow)
 *   3. Record COMMISSION row             (recordCommission)
 *   4. Decrement listing stock + bump salesCount
 *   5. If AUTO delivery: pop one code from deliveryPayload
 *
 * The decrement uses a conditional updateMany for atomicity — if two
 * checkouts race for the last unit, only one wins.
 *
 * Dev-mode caveat
 * ---------------
 * Until PR#10 wires the real payment providers, "payment" is just a
 * debit from the buyer's internal balance. The DB seed gives every
 * buyer enough internal balance to make this work.
 */

const ORDER_INCLUDE = {
  items: {
    include: {
      listing: {
        select: { id: true, slug: true, title: true, sellerId: true, gameId: true, currency: true },
      },
    },
  },
  buyer: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  seller: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  transactions: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.OrderInclude;

export type OrderPayload = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

// ─── Order number ────────────────────────────────────────────────────

/**
 * Generate the human-friendly order number: NM-YYYY-NNNNNN.
 *
 * We use a postgres sequence rather than counting rows so concurrent
 * checkouts can't collide. The sequence is created lazily on first
 * use; a proper migration in PR#15 will pin it explicitly.
 */
let sequenceReady = false;
async function nextOrderNumber(): Promise<string> {
  if (!sequenceReady) {
    await prisma.$executeRawUnsafe(
      `CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1 MINVALUE 1 NO MAXVALUE NO CYCLE`,
    );
    sequenceReady = true;
  }
  const rows = await prisma.$queryRaw<Array<{ nextval: bigint }>>`SELECT nextval('order_number_seq')`;
  const seq = Number(rows[0]?.nextval ?? 1n);
  const year = new Date().getUTCFullYear();
  return `NM-${year}-${String(seq).padStart(6, "0")}`;
}

// ─── Reads ───────────────────────────────────────────────────────────

export async function listOrders(userId: string, query: OrderListQuery): Promise<Page<OrderPayload>> {
  const { take, skip, cursor, limit } = paginate(query);
  const where: Prisma.OrderWhereInput = query.role === "seller" ? { sellerId: userId } : { buyerId: userId };
  if (query.status) where.status = query.status;

  const rows = await prisma.order.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    skip,
    cursor,
    include: ORDER_INCLUDE,
  });
  return buildPage(rows, limit, (r) => r.id);
}

export async function getOrder(userId: string, orderId: string, isMod = false): Promise<OrderPayload> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });
  if (!order) throw AppError.notFound("Order");
  if (!isMod && order.buyerId !== userId && order.sellerId !== userId) {
    // Don't leak the existence of someone else's order via 403.
    throw AppError.notFound("Order");
  }
  return order;
}

// ─── Create + pay (atomic in v1) ─────────────────────────────────────

const AUTO_CONFIRM_HOURS = 48;

export async function createOrder(buyerId: string, input: OrderCreateInput): Promise<OrderPayload> {
  const orderNumber = await nextOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: input.listingId },
      select: {
        id: true, slug: true, title: true, sellerId: true,
        status: true, currency: true, price: true, stockQty: true,
        unlimited: true, deliveryMode: true, deliveryPayload: true,
        seller: { select: { sellerTier: true, status: true } },
      },
    });
    if (!listing) throw AppError.notFound("Listing");
    if (listing.status !== ListingStatus.ACTIVE) throw AppError.conflict("Listing is not available");
    if (listing.sellerId === buyerId) throw AppError.badRequest("You cannot buy your own listing");
    if (listing.seller.status === "BANNED") throw AppError.conflict("Seller is unavailable");

    // Stock check + atomic decrement for non-unlimited listings.
    if (!listing.unlimited) {
      const decremented = await tx.listing.updateMany({
        where: { id: listing.id, stockQty: { gte: input.quantity } },
        data: { stockQty: { decrement: input.quantity } },
      });
      if (decremented.count === 0) throw AppError.conflict("Insufficient stock");
    }

    // Pricing: subtotal × quantity, no promos in v1 (PR#10 will plumb them
    // through and validate the code).
    const subtotal = new Prisma.Decimal(listing.price).mul(input.quantity);
    if (input.promoCode) {
      logger.info({ promoCode: input.promoCode }, "promo code submitted (deferred to PR#10)");
    }
    const total = subtotal;

    const { commission, sellerNet } = commissionFor(listing.seller.sellerTier, subtotal);

    // 1. Debit buyer's wallet (dev-mode "payment").
    await debit(tx, {
      userId: buyerId,
      type: TransactionType.PURCHASE,
      currency: listing.currency,
      amount: total,
      description: `Payment for ${orderNumber}`,
    });

    // 2. Pop auto-delivery payload if applicable.
    let deliveredPayload: Prisma.InputJsonValue | undefined;
    let initialStatus: OrderStatus = OrderStatus.PAID;
    let deliveredAt: Date | null = null;
    let autoConfirmAt: Date | null = null;

    if (listing.deliveryMode === DeliveryMode.AUTO) {
      const payload = listing.deliveryPayload as { codes?: string[] } | null;
      const codes = payload?.codes ?? [];
      if (!listing.unlimited && codes.length < input.quantity) {
        // We've already decremented stock, so this means the listing
        // had a stock/codes mismatch. Treat as a hard conflict.
        throw AppError.conflict("Auto-delivery codes exhausted");
      }
      const taken = listing.unlimited ? generateUnlimitedCodes(input.quantity) : codes.slice(0, input.quantity);
      const remaining = listing.unlimited ? codes : codes.slice(input.quantity);
      deliveredPayload = { codes: taken };
      if (!listing.unlimited) {
        await tx.listing.update({
          where: { id: listing.id },
          data: { deliveryPayload: { codes: remaining } },
        });
      }
      // AUTO delivery happens at checkout; jump straight past PAID.
      initialStatus = OrderStatus.DELIVERING;
      deliveredAt = new Date();
      autoConfirmAt = new Date(Date.now() + AUTO_CONFIRM_HOURS * 60 * 60 * 1000);
    }

    // 3. Create the order + item snapshot.
    const created = await tx.order.create({
      data: {
        number: orderNumber,
        buyerId,
        sellerId: listing.sellerId,
        status: initialStatus,
        currency: listing.currency,
        subtotal,
        commission,
        total,
        paidAt: new Date(),
        deliveredAt,
        autoConfirmAt,
        buyerNote: input.buyerNote,
        items: {
          create: {
            listingId: listing.id,
            titleSnapshot: listing.title,
            priceSnapshot: listing.price,
            currency: listing.currency,
            quantity: input.quantity,
            deliveredPayload,
          },
        },
      },
      include: ORDER_INCLUDE,
    });

    // 4. Freeze seller's net + record commission row.
    await freezeForEscrow(tx, {
      sellerId: listing.sellerId,
      orderId: created.id,
      currency: listing.currency,
      amount: sellerNet,
    });
    await recordCommission(tx, {
      sellerId: listing.sellerId,
      orderId: created.id,
      currency: listing.currency,
      amount: commission,
    });

    // 5. Bump the seller-side aggregate.
    await tx.listing.update({
      where: { id: listing.id },
      data: { salesCount: { increment: input.quantity } },
    });

    return created;
  });

  return order;
}

/**
 * Generate one-shot disposable codes for unlimited listings. In PR#10
 * this becomes integration-specific (e.g. provision a Steam gift code
 * via the publisher's API); for now we mint placeholders so the order
 * has something concrete to deliver.
 */
function generateUnlimitedCodes(n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const chunk = () => Math.random().toString(36).slice(2, 7).toUpperCase();
    out.push(`${chunk()}-${chunk()}-${chunk()}`);
  }
  return out;
}

// ─── State transitions ──────────────────────────────────────────────

export async function markDelivered(sellerId: string, orderId: string): Promise<OrderPayload> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { id: true, sellerId: true, status: true } });
    if (!order) throw AppError.notFound("Order");
    if (order.sellerId !== sellerId) throw AppError.forbidden();
    if (order.status !== OrderStatus.PAID) {
      throw AppError.conflict(`Cannot mark delivered from status ${order.status}`);
    }
    const now = new Date();
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERING,
        deliveredAt: now,
        autoConfirmAt: new Date(now.getTime() + AUTO_CONFIRM_HOURS * 60 * 60 * 1000),
      },
      include: ORDER_INCLUDE,
    });
  });
}

export async function confirmOrder(buyerId: string, orderId: string): Promise<OrderPayload> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true, sellerId: true, status: true, currency: true, total: true, commission: true },
    });
    if (!order) throw AppError.notFound("Order");
    if (order.buyerId !== buyerId) throw AppError.forbidden();
    if (order.status !== OrderStatus.DELIVERING) {
      throw AppError.conflict(`Cannot confirm from status ${order.status}`);
    }

    const sellerNet = new Prisma.Decimal(order.total).minus(new Prisma.Decimal(order.commission));
    await releaseEscrow(tx, {
      sellerId: order.sellerId,
      orderId: order.id,
      currency: order.currency,
      amount: sellerNet,
    });

    return tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED, confirmedAt: new Date() },
      include: ORDER_INCLUDE,
    });
  });
}

export async function cancelOrder(userId: string, orderId: string): Promise<OrderPayload> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true, sellerId: true, status: true, items: { select: { listingId: true, quantity: true } } },
    });
    if (!order) throw AppError.notFound("Order");
    if (order.buyerId !== userId && order.sellerId !== userId) throw AppError.notFound("Order");

    // PENDING is the only "free" cancel — no money has moved yet.
    // PAID/DELIVERING cancellations should go through the dispute flow.
    if (order.status !== OrderStatus.PENDING) {
      throw AppError.conflict(`Cannot cancel from status ${order.status} — open a dispute instead`);
    }

    // Restore stock for any non-unlimited items.
    for (const it of order.items) {
      await tx.listing.updateMany({
        where: { id: it.listingId, unlimited: false },
        data: { stockQty: { increment: it.quantity } },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED, cancelledAt: new Date() },
      include: ORDER_INCLUDE,
    });
  });
}

// ─── Disputes ────────────────────────────────────────────────────────

export async function openDispute(
  userId: string,
  orderId: string,
  input: DisputeOpenInput,
): Promise<OrderPayload> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, buyerId: true, sellerId: true, status: true },
    });
    if (!order) throw AppError.notFound("Order");
    if (order.buyerId !== userId && order.sellerId !== userId) throw AppError.notFound("Order");
    // Disputes are valid while there's escrow on the table — i.e. paid
    // but not yet completed/cancelled/refunded.
    if (![OrderStatus.PAID, OrderStatus.DELIVERING].includes(order.status)) {
      throw AppError.conflict(`Cannot open dispute from status ${order.status}`);
    }
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DISPUTED,
        disputedAt: new Date(),
        // Stash the opener's reason on the order itself for the mod's
        // initial view; the full thread lives in PR#11 chat (order:<id>).
        buyerNote: order.buyerId === userId
          ? `${input.reason}${input.details ? `\n\n${input.details}` : ""}`
          : undefined,
        sellerNote: order.sellerId === userId
          ? `${input.reason}${input.details ? `\n\n${input.details}` : ""}`
          : undefined,
      },
      include: ORDER_INCLUDE,
    });
  });
}

export async function resolveDispute(
  modId: string,
  orderId: string,
  input: DisputeResolveInput,
): Promise<OrderPayload> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true, buyerId: true, sellerId: true, status: true,
        currency: true, total: true, commission: true,
      },
    });
    if (!order) throw AppError.notFound("Order");
    if (order.status !== OrderStatus.DISPUTED) {
      throw AppError.conflict(`Cannot resolve dispute from status ${order.status}`);
    }

    const total = new Prisma.Decimal(order.total);
    const sellerNet = total.minus(new Prisma.Decimal(order.commission));

    if (input.resolution === "release") {
      // Seller wins — release the held escrow.
      await releaseEscrow(tx, {
        sellerId: order.sellerId,
        orderId: order.id,
        currency: order.currency,
        amount: sellerNet,
        description: `Dispute resolved in seller's favor on ${order.id}`,
      });
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.COMPLETED, confirmedAt: new Date() },
        include: ORDER_INCLUDE,
      });
    }

    if (input.resolution === "refund") {
      // Buyer wins — refund the full escrow back.
      await refundEscrow(tx, {
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        orderId: order.id,
        currency: order.currency,
        amount: sellerNet,
        description: `Dispute refund on ${order.id}`,
      });
      return tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED, refundedAt: new Date() },
        include: ORDER_INCLUDE,
      });
    }

    // Split: refund a percent to the buyer, release the remainder.
    const pct = new Prisma.Decimal(input.refundPercent ?? 0).div(100);
    const refundAmount = sellerNet.mul(pct).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const releaseAmount = sellerNet.minus(refundAmount);

    if (refundAmount.gt(0)) {
      await refundEscrow(tx, {
        sellerId: order.sellerId,
        buyerId: order.buyerId,
        orderId: order.id,
        currency: order.currency,
        amount: refundAmount,
        description: `Dispute split refund (${input.refundPercent}%) on ${order.id}`,
      });
    }
    if (releaseAmount.gt(0)) {
      await releaseEscrow(tx, {
        sellerId: order.sellerId,
        orderId: order.id,
        currency: order.currency,
        amount: releaseAmount,
        description: `Dispute split release (${100 - (input.refundPercent ?? 0)}%) on ${order.id}`,
      });
    }
    return tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.REFUNDED, refundedAt: new Date() },
      include: ORDER_INCLUDE,
    });
  });
}
