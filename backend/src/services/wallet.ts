import {
  Prisma,
  type PrismaClient,
  TransactionType,
  TransactionStatus,
  type Currency,
} from "@prisma/client";
import { AppError } from "../utils/errors.js";

/**
 * Wallet & escrow service.
 *
 * Every monetary movement in the system flows through one of these
 * helpers so we get:
 *
 *   - Atomicity: User.balance / balanceFrozen are always updated in
 *     the same transaction as the corresponding `Transaction` row.
 *   - Auditability: every change has a Transaction record, never a
 *     bare balance update.
 *   - Symmetry: deposit + withdraw, freeze + release/refund are
 *     mirror images so reasoning about totals stays simple.
 *
 * Why this lives outside auth.service: escrow is shared between
 * marketplace orders, withdrawals (PR#10), referral payouts (PR#13),
 * and promo bonuses. It needs its own module.
 *
 * Critical invariant
 * ------------------
 *   user.balance        — money the user can spend or withdraw
 *   user.balanceFrozen  — money held in escrow (cannot withdraw, cannot spend)
 *   total assets        = balance + balanceFrozen
 *
 * The platform itself doesn't have a User row; commissions are
 * implicitly the difference between buyer-paid and seller-received
 * amounts. Building a proper "platform ledger" is a PR#10 concern.
 */

/** A Prisma client OR a transaction handle — service helpers accept either. */
type Tx = Prisma.TransactionClient | PrismaClient;

interface MoneyInput {
  amount: Prisma.Decimal | number | string;
  currency: Currency;
}

function dec(v: Prisma.Decimal | number | string): Prisma.Decimal {
  return new Prisma.Decimal(v);
}

/**
 * Credit a user's available balance and write a matching transaction.
 *
 * Used by: deposits (PR#10), escrow release to seller, refunds, promo
 * bonuses. Negative amounts are rejected — callers must use `debit`
 * instead so the intent is explicit.
 */
export async function credit(
  tx: Tx,
  args: MoneyInput & {
    userId: string;
    type: TransactionType;
    orderId?: string;
    description?: string;
    provider?: Prisma.TransactionCreateInput["provider"];
    providerTxnId?: string;
    metadata?: Prisma.InputJsonValue;
  },
): Promise<void> {
  const amount = dec(args.amount);
  if (amount.lte(0)) throw AppError.badRequest("credit amount must be positive");

  await tx.user.update({
    where: { id: args.userId },
    data: { balance: { increment: amount } },
  });
  await tx.transaction.create({
    data: {
      userId: args.userId,
      orderId: args.orderId,
      type: args.type,
      status: TransactionStatus.COMPLETED,
      currency: args.currency,
      amount,
      provider: args.provider,
      providerTxnId: args.providerTxnId,
      description: args.description,
      metadata: args.metadata,
    },
  });
}

/**
 * Debit a user's available balance.
 *
 * Throws PAYMENT_REQUIRED when the user has insufficient funds. The
 * caller is responsible for catching it and offering the user a top-up
 * flow rather than letting the 402 leak to the UI raw.
 */
export async function debit(
  tx: Tx,
  args: MoneyInput & {
    userId: string;
    type: TransactionType;
    orderId?: string;
    description?: string;
    metadata?: Prisma.InputJsonValue;
  },
): Promise<void> {
  const amount = dec(args.amount);
  if (amount.lte(0)) throw AppError.badRequest("debit amount must be positive");

  // Conditional update — race-safe even under concurrent debits because
  // Postgres serializes the row update. If another transaction beats us
  // to the punch, `count` is 0 and we throw.
  const updated = await tx.user.updateMany({
    where: { id: args.userId, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  });
  if (updated.count === 0) {
    throw new AppError("PAYMENT_REQUIRED", "Insufficient balance");
  }

  await tx.transaction.create({
    data: {
      userId: args.userId,
      orderId: args.orderId,
      type: args.type,
      status: TransactionStatus.COMPLETED,
      currency: args.currency,
      // Convention: outflows are recorded as negative amounts so a sum
      // over the user's transactions equals their net change.
      amount: amount.neg(),
      description: args.description,
      metadata: args.metadata,
    },
  });
}

/**
 * Move money from `balance` to `balanceFrozen` and record an
 * ESCROW_HOLD transaction.
 *
 * Used at order checkout: the buyer is debited (real money out), the
 * seller's escrow is credited (money in, but frozen until the buyer
 * confirms or auto-confirm fires).
 */
export async function freezeForEscrow(
  tx: Tx,
  args: MoneyInput & { sellerId: string; orderId: string; description?: string },
): Promise<void> {
  const amount = dec(args.amount);
  if (amount.lte(0)) throw AppError.badRequest("escrow amount must be positive");

  await tx.user.update({
    where: { id: args.sellerId },
    data: { balanceFrozen: { increment: amount } },
  });
  await tx.transaction.create({
    data: {
      userId: args.sellerId,
      orderId: args.orderId,
      type: TransactionType.ESCROW_HOLD,
      status: TransactionStatus.COMPLETED,
      currency: args.currency,
      amount,
      description: args.description ?? `Escrow held for order ${args.orderId}`,
    },
  });
}

/**
 * Release escrow → move money from the seller's `balanceFrozen` to
 * their `balance`. Fires when:
 *   - buyer confirms receipt
 *   - 48h auto-confirm worker triggers
 *   - mod resolves a dispute in seller's favor
 */
export async function releaseEscrow(
  tx: Tx,
  args: MoneyInput & { sellerId: string; orderId: string; description?: string },
): Promise<void> {
  const amount = dec(args.amount);
  if (amount.lte(0)) throw AppError.badRequest("release amount must be positive");

  const updated = await tx.user.updateMany({
    where: { id: args.sellerId, balanceFrozen: { gte: amount } },
    data: {
      balanceFrozen: { decrement: amount },
      balance: { increment: amount },
    },
  });
  if (updated.count === 0) {
    // Either the user vanished (FK violation would have hit first) or
    // the frozen balance is less than expected — the latter would point
    // to a serious accounting bug, so we fail loudly.
    throw AppError.internal("Escrow release: frozen balance < release amount");
  }

  await tx.transaction.create({
    data: {
      userId: args.sellerId,
      orderId: args.orderId,
      type: TransactionType.ESCROW_RELEASE,
      status: TransactionStatus.COMPLETED,
      currency: args.currency,
      amount,
      description: args.description ?? `Escrow released for order ${args.orderId}`,
    },
  });
}

/**
 * Refund escrow back to the buyer. The seller's frozen balance shrinks;
 * the buyer's available balance grows. Used when:
 *   - buyer cancels (where allowed)
 *   - mod resolves a dispute in the buyer's favor
 */
export async function refundEscrow(
  tx: Tx,
  args: MoneyInput & {
    sellerId: string;
    buyerId: string;
    orderId: string;
    description?: string;
  },
): Promise<void> {
  const amount = dec(args.amount);
  if (amount.lte(0)) throw AppError.badRequest("refund amount must be positive");

  const updated = await tx.user.updateMany({
    where: { id: args.sellerId, balanceFrozen: { gte: amount } },
    data: { balanceFrozen: { decrement: amount } },
  });
  if (updated.count === 0) {
    throw AppError.internal("Escrow refund: frozen balance < refund amount");
  }
  await tx.user.update({
    where: { id: args.buyerId },
    data: { balance: { increment: amount } },
  });

  // Two transactions so each side's history is symmetric — seller sees
  // a REFUND debit, buyer sees a REFUND credit.
  await tx.transaction.create({
    data: {
      userId: args.sellerId,
      orderId: args.orderId,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      currency: args.currency,
      amount: amount.neg(),
      description: args.description ?? `Refund of escrow for order ${args.orderId}`,
    },
  });
  await tx.transaction.create({
    data: {
      userId: args.buyerId,
      orderId: args.orderId,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      currency: args.currency,
      amount,
      description: args.description ?? `Refund received for order ${args.orderId}`,
    },
  });
}

/**
 * Record the platform commission as a standalone audit row. The
 * underlying balance movement already happened inside
 * freezeForEscrow / releaseEscrow (the seller only ever sees the net
 * amount); this row exists purely so reports can answer "how much did
 * we earn last month?" without recomputing every order.
 */
export async function recordCommission(
  tx: Tx,
  args: MoneyInput & { sellerId: string; orderId: string },
): Promise<void> {
  const amount = dec(args.amount);
  if (amount.lte(0)) return; // free orders are valid (e.g. 100% promo)

  await tx.transaction.create({
    data: {
      userId: args.sellerId,
      orderId: args.orderId,
      type: TransactionType.COMMISSION,
      status: TransactionStatus.COMPLETED,
      currency: args.currency,
      amount: amount.neg(),
      description: `Platform commission for order ${args.orderId}`,
    },
  });
}
