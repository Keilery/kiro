import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../../database/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { paginate, buildPage, type Page } from "../../../utils/pagination.js";
import type {
  ReviewCreateInput,
  ReviewReplyInput,
  ReviewListQuery,
} from "./reviews.dto.js";

/**
 * Reviews service.
 *
 * Why aggregates are recomputed (not incremented):
 *
 * Tempting alternative: keep `salesCount`-style counters and add 1 when
 * a review lands. Stays accurate for ratingAvg though only if you also
 * track sum-of-ratings, which doubles the bookkeeping and breaks the
 * moment a review is hidden by moderation. So we recompute from the
 * source rows in the same transaction. At our review volume (~thousands
 * per listing tops) this is a millisecond and worth the simplicity.
 *
 * The Review.@@unique([authorId, orderId]) constraint is the contract:
 * one review per author per order. We catch P2002 in the global error
 * handler, but we also pre-check here so the user sees a clean 409
 * instead of a generic constraint error.
 */

const REVIEW_INCLUDE = {
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true },
  },
} satisfies Prisma.ReviewInclude;

export type ReviewPayload = Prisma.ReviewGetPayload<{ include: typeof REVIEW_INCLUDE }>;

// ─── Create ──────────────────────────────────────────────────────────

export async function createReview(authorId: string, input: ReviewCreateInput): Promise<ReviewPayload> {
  return prisma.$transaction(async (tx) => {
    // Verify the order exists, the author was the buyer, and it's
    // actually completed. Reviewing a DELIVERING order is too early;
    // reviewing a CANCELLED order doesn't make sense; reviewing
    // someone else's order is straight up forbidden.
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: {
        id: true,
        status: true,
        buyerId: true,
        sellerId: true,
        items: { select: { listingId: true }, take: 1 },
      },
    });
    if (!order) throw AppError.notFound("Order");
    if (order.buyerId !== authorId) throw AppError.forbidden("Only the buyer of this order can review it");
    if (order.status !== OrderStatus.COMPLETED) {
      throw AppError.badRequest("Only completed orders can be reviewed");
    }

    // Check uniqueness up front so the user sees a meaningful 409.
    const existing = await tx.review.findFirst({
      where: { authorId, orderId: order.id },
      select: { id: true },
    });
    if (existing) throw AppError.conflict("You already reviewed this order");

    const listingId = order.items[0]?.listingId;

    const created = await tx.review.create({
      data: {
        authorId,
        subjectId: order.sellerId,
        orderId: order.id,
        listingId,
        rating: input.rating,
        body: input.body,
        imageUrls: input.imageUrls ?? [],
        isPublished: true,
      },
      include: REVIEW_INCLUDE,
    });

    if (listingId) await recomputeListingAggregate(tx, listingId);
    return created;
  });
}

// ─── Seller reply ────────────────────────────────────────────────────

export async function replyToReview(
  sellerId: string,
  reviewId: string,
  input: ReviewReplyInput,
): Promise<ReviewPayload> {
  // Sellers may reply once. Edits are allowed (overwrites are fine for
  // now; an audit trail can be added later if abuse warrants it).
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw AppError.notFound("Review");
  if (review.subjectId !== sellerId) throw AppError.forbidden();

  return prisma.review.update({
    where: { id: reviewId },
    data: { sellerReply: input.reply, sellerRepliedAt: new Date() },
    include: REVIEW_INCLUDE,
  });
}

// ─── Reads ───────────────────────────────────────────────────────────

export async function listReviewsForListing(
  listingId: string,
  query: ReviewListQuery,
  ctx: { viewerId?: string; viewerCanSeeAll?: boolean } = {},
): Promise<Page<ReviewPayload>> {
  const { take, skip, cursor, limit } = paginate(query);

  const where: Prisma.ReviewWhereInput = { listingId };
  if (query.ratingMin) where.rating = { gte: query.ratingMin };

  // Only the listing's seller (or a mod) can see hidden reviews.
  if (!query.includeHidden) {
    where.isPublished = true;
  } else {
    const isOwner =
      ctx.viewerId &&
      (await prisma.listing.findFirst({
        where: { id: listingId, sellerId: ctx.viewerId },
        select: { id: true },
      }));
    if (!isOwner && !ctx.viewerCanSeeAll) where.isPublished = true;
  }

  const rows = await prisma.review.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    skip,
    cursor,
    include: REVIEW_INCLUDE,
  });
  return buildPage(rows, limit, (r) => r.id);
}

export async function listReviewsForSeller(
  sellerId: string,
  query: ReviewListQuery,
): Promise<Page<ReviewPayload>> {
  const { take, skip, cursor, limit } = paginate(query);
  const where: Prisma.ReviewWhereInput = { subjectId: sellerId, isPublished: true };
  if (query.ratingMin) where.rating = { gte: query.ratingMin };

  const rows = await prisma.review.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take,
    skip,
    cursor,
    include: REVIEW_INCLUDE,
  });
  return buildPage(rows, limit, (r) => r.id);
}

// ─── Aggregate maintenance ───────────────────────────────────────────

/**
 * Recompute the listing's average rating and review count from the
 * source rows. Called inside a transaction so the read is consistent
 * with the write that triggered it.
 *
 * Hidden reviews don't count toward the public aggregate, otherwise a
 * user could leave a one-star review, get it hidden by mods, and still
 * tank the listing's rating.
 */
async function recomputeListingAggregate(tx: Prisma.TransactionClient, listingId: string): Promise<void> {
  const agg = await tx.review.aggregate({
    where: { listingId, isPublished: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const ratingAvg = agg._avg.rating ?? 0;
  const reviewCount = agg._count._all;
  await tx.listing.update({
    where: { id: listingId },
    // Round to 2dp on the way in to match the DB's Float-but-display-as-2dp convention.
    data: { ratingAvg: Math.round(ratingAvg * 100) / 100, reviewCount },
  });
}
