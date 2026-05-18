import { Prisma, SellerTier } from "@prisma/client";

/**
 * Platform commission policy.
 *
 * The platform takes a percentage of every successful sale. Tier
 * progression is the seller's main upgrade path — better numbers reward
 * volume and KYC verification. The values below are placeholders that
 * the admin panel (PR#8) will eventually edit at runtime; for now they
 * live in code so we get type-safety and a single source of truth.
 *
 * Seller economics worked example (RUB 10 000 listing, GOLD seller):
 *   buyer pays         10 000.00
 *   commission (5.00%)    500.00
 *   seller receives     9 500.00
 */

export interface CommissionPolicy {
  /** Percent of the order subtotal the platform keeps. */
  feePercent: number;
  /** Hard floor — useful for very cheap items where percent rounds to 0. */
  minFee: number;
}

const POLICY: Record<SellerTier, CommissionPolicy> = {
  // Unverified / brand-new sellers — highest fee
  NONE:     { feePercent: 8.5, minFee: 5 },
  BRONZE:   { feePercent: 7.0, minFee: 5 },
  SILVER:   { feePercent: 6.0, minFee: 5 },
  GOLD:     { feePercent: 5.0, minFee: 5 },
  // Top tier — KYC verified, > 500 sales, < 1% dispute rate
  PLATINUM: { feePercent: 3.5, minFee: 5 },
};

/**
 * Compute the commission the platform retains on a given subtotal.
 *
 * Decimal-safe: subtotal arrives as a Prisma.Decimal (the shape returned
 * from `prisma.listing.findUnique`); we keep arithmetic inside Decimal
 * to avoid float drift on values like 0.07 × 1_999_900.
 */
export function commissionFor(
  tier: SellerTier,
  subtotal: Prisma.Decimal | number | string,
): { commission: Prisma.Decimal; sellerNet: Prisma.Decimal; policy: CommissionPolicy } {
  const policy = POLICY[tier];
  const sub = new Prisma.Decimal(subtotal);
  const pct = new Prisma.Decimal(policy.feePercent).div(100);
  const raw = sub.mul(pct);
  const min = new Prisma.Decimal(policy.minFee);
  // Round half-up to 2 decimal places — financial standard.
  const commission = (raw.lt(min) ? min : raw).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  // Never let commission exceed the subtotal (guards against absurd minFee
  // configurations; matters for cents-priced listings).
  const safeCommission = commission.gt(sub) ? sub : commission;
  return {
    commission: safeCommission,
    sellerNet: sub.minus(safeCommission),
    policy,
  };
}

export function getPolicy(tier: SellerTier): CommissionPolicy {
  return POLICY[tier];
}
