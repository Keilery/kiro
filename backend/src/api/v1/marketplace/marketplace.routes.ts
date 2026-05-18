import { Router } from "express";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { validate } from "../../../utils/validate.js";
import { requireAuth, optionalAuth, requireRole } from "../../../middleware/auth.js";
import { rateLimit } from "../../../middleware/rateLimit.js";
import { AppError } from "../../../utils/errors.js";
import {
  ListingCreateSchema,
  ListingUpdateSchema,
  ListingListQuerySchema,
  ListingBoostSchema,
  ListingPublishSchema,
  ListingReportSchema,
  ListingIdParam,
  ListingSlugParam,
  SearchSuggestQuerySchema,
} from "./marketplace.dto.js";
import {
  ReviewCreateSchema,
  ReviewReplySchema,
  ReviewListQuerySchema,
  ReviewIdParam,
} from "./reviews.dto.js";
import * as svc from "./marketplace.service.js";
import * as reviews from "./reviews.service.js";

/**
 * Marketplace HTTP layer.
 *
 * Order of routes matters: more specific paths (`/listings/search`,
 * `/listings/featured`) must come before the catch-all `/listings/:slug`
 * so Express doesn't dispatch them to the slug handler.
 *
 * Auth gating policy:
 *   - public reads use optionalAuth so the service can widen visibility
 *     for owners or moderators.
 *   - mutations require auth + (mostly) the SELLER role.
 *   - reports require auth (any role) — we want low friction here.
 */
const router = Router();

// Stricter limiter for write endpoints to slow down toxic seller abuse.
const writeLimiter = rateLimit({ windowMs: 60_000, max: 60, key: "marketplace-write" });

// Module discovery — kept for parity with the stub manifest.
router.get("/", (_req, res) => {
  res.json({ module: "marketplace", status: "implemented", paths: ["/listings", "/games", "/categories"] });
});

// ─── Catalog ─────────────────────────────────────────────────────────

router.get(
  "/games",
  asyncHandler(async (_req, res) => {
    res.json({ games: await svc.listGames() });
  }),
);

router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    res.json({ categories: await svc.getCategoryTree() });
  }),
);

// ─── Listings: read ─────────────────────────────────────────────────

router.get(
  "/listings",
  optionalAuth,
  validate({ query: ListingListQuerySchema }),
  asyncHandler(async (req, res) => {
    const page = await svc.listListings(req.query as never, {
      viewerId: req.user?.sub,
      viewerCanSeeAll:
        req.user?.role === UserRole.MODERATOR ||
        req.user?.role === UserRole.ADMIN ||
        req.user?.role === UserRole.SUPERADMIN,
    });
    res.json(page);
  }),
);

router.get(
  "/listings/search",
  validate({ query: SearchSuggestQuerySchema }),
  asyncHandler(async (req, res) => {
    const { q, limit } = req.query as unknown as { q: string; limit: number };
    res.json({ suggestions: await svc.searchSuggest(q, limit) });
  }),
);

router.get(
  "/listings/featured",
  asyncHandler(async (_req, res) => {
    res.json({ listings: await svc.getFeatured(12) });
  }),
);

router.get(
  "/listings/:slug",
  optionalAuth,
  validate({ params: ListingSlugParam }),
  asyncHandler(async (req, res) => {
    const listing = await svc.getListingBySlug(req.params.slug, {
      viewerId: req.user?.sub,
      viewerCanSeeAll:
        req.user?.role === UserRole.MODERATOR ||
        req.user?.role === UserRole.ADMIN ||
        req.user?.role === UserRole.SUPERADMIN,
    });
    res.json({ listing });
  }),
);

router.get(
  "/listings/:slug/related",
  validate({ params: ListingSlugParam }),
  asyncHandler(async (req, res) => {
    // Fetch the source listing so we can look up related items by id.
    // We accept the extra round-trip so the URL stays slug-friendly.
    const source = await svc.getListingBySlug(req.params.slug, {});
    res.json({ listings: await svc.getRelated(source.id, 6) });
  }),
);

// ─── Listings: write ────────────────────────────────────────────────

router.post(
  "/listings",
  requireAuth,
  requireRole(UserRole.SELLER),
  writeLimiter,
  validate({ body: ListingCreateSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const listing = await svc.createListing(req.user.sub, req.body);
    res.status(201).json({ listing });
  }),
);

router.patch(
  "/listings/:id",
  requireAuth,
  requireRole(UserRole.SELLER),
  writeLimiter,
  validate({ params: ListingIdParam, body: ListingUpdateSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const isMod =
      req.user.role === UserRole.MODERATOR ||
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.SUPERADMIN;
    const listing = await svc.updateListing(req.user.sub, req.params.id, req.body, isMod);
    res.json({ listing });
  }),
);

router.delete(
  "/listings/:id",
  requireAuth,
  requireRole(UserRole.SELLER),
  writeLimiter,
  validate({ params: ListingIdParam }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const isMod =
      req.user.role === UserRole.MODERATOR ||
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.SUPERADMIN;
    await svc.archiveListing(req.user.sub, req.params.id, isMod);
    res.status(204).end();
  }),
);

router.patch(
  "/listings/:id/status",
  requireAuth,
  requireRole(UserRole.SELLER),
  writeLimiter,
  validate({ params: ListingIdParam, body: ListingPublishSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const listing = await svc.setListingStatus(req.user.sub, req.params.id, req.body);
    res.json({ listing });
  }),
);

router.post(
  "/listings/:id/duplicate",
  requireAuth,
  requireRole(UserRole.SELLER),
  writeLimiter,
  validate({ params: ListingIdParam }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const listing = await svc.duplicateListing(req.user.sub, req.params.id);
    res.status(201).json({ listing });
  }),
);

router.post(
  "/listings/:id/boost",
  requireAuth,
  requireRole(UserRole.SELLER),
  writeLimiter,
  validate({ params: ListingIdParam, body: ListingBoostSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const listing = await svc.boostListing(req.user.sub, req.params.id, req.body);
    res.json({ listing });
  }),
);

router.post(
  "/listings/:id/report",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 5, key: "listing-report" }),
  validate({ params: ListingIdParam, body: ListingReportSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await svc.reportListing(req.user.sub, req.params.id, req.body);
    res.status(201).json(result);
  }),
);

// ─── Reviews ─────────────────────────────────────────────────────────

router.get(
  "/listings/:id/reviews",
  optionalAuth,
  validate({ params: ListingIdParam, query: ReviewListQuerySchema }),
  asyncHandler(async (req, res) => {
    const page = await reviews.listReviewsForListing(req.params.id, req.query as never, {
      viewerId: req.user?.sub,
      viewerCanSeeAll:
        req.user?.role === UserRole.MODERATOR ||
        req.user?.role === UserRole.ADMIN ||
        req.user?.role === UserRole.SUPERADMIN,
    });
    res.json(page);
  }),
);

router.post(
  "/reviews",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 10, key: "review-create" }),
  validate({ body: ReviewCreateSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const review = await reviews.createReview(req.user.sub, req.body);
    res.status(201).json({ review });
  }),
);

router.post(
  "/reviews/:id/reply",
  requireAuth,
  requireRole(UserRole.SELLER),
  rateLimit({ windowMs: 60_000, max: 30, key: "review-reply" }),
  validate({ params: ReviewIdParam, body: ReviewReplySchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const review = await reviews.replyToReview(req.user.sub, req.params.id, req.body);
    res.json({ review });
  }),
);

router.get(
  "/sellers/:sellerId/reviews",
  validate({
    params: z.object({ sellerId: z.string().cuid() }),
    query: ReviewListQuerySchema,
  }),
  asyncHandler(async (req, res) => {
    const page = await reviews.listReviewsForSeller(req.params.sellerId, req.query as never);
    res.json(page);
  }),
);

export { router as marketplaceRouter };
