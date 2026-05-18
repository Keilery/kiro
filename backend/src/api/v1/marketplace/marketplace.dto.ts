import { z } from "zod";
import {
  Currency,
  DeliveryMode,
  ListingStatus,
  ListingType,
  Platform,
} from "@prisma/client";
import { PaginationQuerySchema } from "../../../utils/pagination.js";

/**
 * Marketplace DTOs.
 *
 * Hard validation only (shape + bounds). Cross-row business rules
 * (e.g. "stock must equal codes.length for AUTO delivery") live in the
 * service so they have access to the loaded entity.
 *
 * The shapes are intentionally close to the Prisma model so we can
 * `prisma.listing.create({ data: dto })` after spreading. Fields the
 * client must NOT control (sellerId, status, slug, stats) are absent
 * by design — the service injects them.
 */

// ─── Shared helpers ──────────────────────────────────────────────────

const Money = z.coerce
  .number()
  .min(0, "price must be >= 0")
  .max(99_999_999.99, "price too large")
  // Coerce to a 2-decimal string so Prisma.Decimal stores cleanly. We
  // store as string to dodge the JS-float trap (e.g. 0.1 + 0.2 ≠ 0.3).
  .transform((n) => n.toFixed(2));

const SlugTags = z
  .array(z.string().min(1).max(32).regex(/^[a-z0-9-]+$/, "lowercase, digits, dash"))
  .max(12)
  .optional();

// Bulk discount table: { "5": 5, "10": 12 } means buy ≥5 → 5% off, ≥10 → 12% off.
const BulkDiscount = z
  .record(
    z.string().regex(/^\d+$/, "qty key must be a positive integer"),
    z.number().min(0).max(80),
  )
  .optional();

// ─── Create / Update ─────────────────────────────────────────────────

export const ListingCreateSchema = z
  .object({
    title: z.string().min(6).max(140).trim(),
    description: z.string().max(8000).optional(),
    type: z.nativeEnum(ListingType),
    gameId: z.string().cuid().optional(),
    categoryId: z.string().cuid().optional(),

    currency: z.nativeEnum(Currency).default(Currency.RUB),
    price: Money,
    compareAtPrice: Money.optional(),
    bulkDiscount: BulkDiscount,

    stockQty: z.number().int().min(0).max(100_000).default(1),
    unlimited: z.boolean().default(false),

    deliveryMode: z.nativeEnum(DeliveryMode).default(DeliveryMode.MANUAL),
    /**
     * For AUTO delivery only. We accept the raw codes here — the service
     * encrypts them at rest in PR#10 (currently stored as plain JSON in
     * the schema's `deliveryPayload` field). Each code is one unit of stock.
     */
    deliveryCodes: z.array(z.string().min(1).max(512)).max(10_000).optional(),

    platform: z.nativeEnum(Platform).optional(),
    serverName: z.string().max(64).optional(),

    tags: SlugTags,

    metaTitle: z.string().max(160).optional(),
    metaDescription: z.string().max(320).optional(),
  })
  // Sanity check: a compareAtPrice (the "was X" struck-through anchor)
  // only makes sense if it's strictly greater than the actual price.
  .refine(
    (v) => !v.compareAtPrice || Number(v.compareAtPrice) > Number(v.price),
    { message: "compareAtPrice must be greater than price", path: ["compareAtPrice"] },
  );

/**
 * Update reuses Create's shape but every field is optional. We can't
 * use `.partial()` directly on a refined schema — Zod drops the
 * refinement — so we re-attach it.
 */
export const ListingUpdateSchema = ListingCreateSchema.innerType()
  .partial()
  .refine(
    (v) =>
      v.compareAtPrice == null ||
      v.price == null ||
      Number(v.compareAtPrice) > Number(v.price),
    { message: "compareAtPrice must be greater than price", path: ["compareAtPrice"] },
  );

// ─── Lifecycle ───────────────────────────────────────────────────────

export const ListingPublishSchema = z.object({
  status: z.enum([
    ListingStatus.ACTIVE,
    ListingStatus.PAUSED,
    ListingStatus.ARCHIVED,
  ]),
});

export const ListingBoostSchema = z.object({
  hours: z.number().int().min(1).max(7 * 24, "max 7 days"),
});

// ─── List query (filters + sort + pagination) ───────────────────────

export const ListingSort = z.enum([
  "newest",
  "price_asc",
  "price_desc",
  "popular",
  "rating",
]);
export type ListingSort = z.infer<typeof ListingSort>;

export const ListingListQuerySchema = PaginationQuerySchema.extend({
  q: z.string().min(1).max(100).optional(),
  gameId: z.string().cuid().optional(),
  gameSlug: z.string().min(1).max(80).optional(),
  categoryId: z.string().cuid().optional(),
  type: z.nativeEnum(ListingType).optional(),
  platform: z.nativeEnum(Platform).optional(),
  sellerId: z.string().cuid().optional(),

  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  ratingMin: z.coerce.number().min(0).max(5).optional(),

  sort: ListingSort.optional(),
  // Sellers viewing their own dashboard need to see drafts too. The
  // service decides whether the caller is allowed to widen it.
  status: z.nativeEnum(ListingStatus).optional(),
}).refine(
  (q) => q.priceMin == null || q.priceMax == null || q.priceMin <= q.priceMax,
  { message: "priceMin must be <= priceMax", path: ["priceMin"] },
);

export const SearchSuggestQuerySchema = z.object({
  q: z.string().min(2).max(60),
  limit: z.coerce.number().int().min(1).max(10).default(6),
});

// ─── Reports ─────────────────────────────────────────────────────────

export const ListingReportSchema = z.object({
  reason: z.string().min(4).max(80),
  details: z.string().max(2000).optional(),
});

// ─── ID parameters ───────────────────────────────────────────────────

export const ListingIdParam = z.object({ id: z.string().cuid() });
export const ListingSlugParam = z.object({
  slug: z.string().min(1).max(140).regex(/^[a-z0-9-]+$/),
});

// ─── Type aliases used by the service ───────────────────────────────

export type ListingCreateInput = z.infer<typeof ListingCreateSchema>;
export type ListingUpdateInput = z.infer<typeof ListingUpdateSchema>;
export type ListingListQuery = z.infer<typeof ListingListQuerySchema>;
export type ListingBoostInput = z.infer<typeof ListingBoostSchema>;
export type ListingPublishInput = z.infer<typeof ListingPublishSchema>;
export type ListingReportInput = z.infer<typeof ListingReportSchema>;
