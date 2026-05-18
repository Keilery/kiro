import {
  Prisma,
  ListingStatus,
  ReportTarget,
  ReportStatus,
  type Listing,
  type Category,
} from "@prisma/client";
import { prisma } from "../../../database/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { paginate, buildPage, type Page } from "../../../utils/pagination.js";
import type {
  ListingCreateInput,
  ListingUpdateInput,
  ListingListQuery,
  ListingBoostInput,
  ListingPublishInput,
  ListingReportInput,
} from "./marketplace.dto.js";

/**
 * Marketplace service.
 *
 * Holds every listing-related operation. The route layer is a thin
 * shell — its only job is HTTP shape, validation, and auth gating.
 *
 * Conventions used throughout:
 *   - Public-facing reads filter to ACTIVE listings unless the caller
 *     is the owning seller (or a moderator). The service decides this
 *     based on `viewerId` + `viewerCanSeeAll`.
 *   - Stats columns (viewCount, salesCount, ratingAvg, reviewCount) are
 *     denormalized; we update them inside the same transaction that
 *     mutates the source-of-truth row to keep them in sync.
 *   - Mutations are wrapped in `prisma.$transaction` whenever they
 *     touch more than one row.
 */

// ─── Type helpers ────────────────────────────────────────────────────

const LISTING_DETAIL_INCLUDE = {
  images: { orderBy: { position: "asc" as const } },
  game: { select: { id: true, slug: true, title: true, iconUrl: true } },
  category: { select: { id: true, slug: true, title: true } },
  seller: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      sellerTier: true,
      level: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ListingInclude;

const LISTING_LIST_INCLUDE = {
  images: { take: 1, where: { isCover: true }, orderBy: { position: "asc" as const } },
  game: { select: { slug: true, title: true } },
  seller: { select: { id: true, username: true, displayName: true, sellerTier: true } },
} satisfies Prisma.ListingInclude;

export type ListingDetail = Prisma.ListingGetPayload<{ include: typeof LISTING_DETAIL_INCLUDE }>;
export type ListingCard   = Prisma.ListingGetPayload<{ include: typeof LISTING_LIST_INCLUDE }>;

// ─── Slug generation ─────────────────────────────────────────────────

/**
 * Convert a title to a kebab-cased slug. Russian / latin extended
 * characters are stripped (DB uses ASCII slugs for clean URLs).
 */
function slugifyBase(title: string): string {
  // Best-effort transliteration table for the common Cyrillic letters
  // we expect in listing titles. Imperfect but predictable, and avoids
  // pulling in a heavy npm dep.
  const cyrMap: Record<string, string> = {
    а:"a", б:"b", в:"v", г:"g", д:"d", е:"e", ё:"e", ж:"zh", з:"z", и:"i",
    й:"y", к:"k", л:"l", м:"m", н:"n", о:"o", п:"p", р:"r", с:"s", т:"t",
    у:"u", ф:"f", х:"h", ц:"ts", ч:"ch", ш:"sh", щ:"sch", ъ:"", ы:"y",
    ь:"", э:"e", ю:"yu", я:"ya",
  };
  const lower = title.toLowerCase();
  let out = "";
  for (const ch of lower) {
    out += cyrMap[ch] ?? ch;
  }
  return out
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "listing";
}

/**
 * Generate a unique slug. We try the base, then `base-2`, `base-3`, …
 * Up to 12 attempts; after that we append a short random suffix and
 * accept whatever comes out (collisions there are astronomically rare).
 */
async function uniqueSlug(base: string, tx: Prisma.TransactionClient | typeof prisma): Promise<string> {
  const root = slugifyBase(base);
  for (let i = 0; i < 12; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const existing = await tx.listing.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  return `${root}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Sort → orderBy translation ──────────────────────────────────────

function orderByFor(sort: ListingListQuery["sort"]): Prisma.ListingOrderByWithRelationInput[] {
  // Boosted listings always float to the top of any page; we add a
  // `boostedUntil` desc-nulls-last clause as the first sort key.
  const boostFirst: Prisma.ListingOrderByWithRelationInput = { boostedUntil: { sort: "desc", nulls: "last" } };
  // Always end with `id` for a stable cursor anchor (see pagination util).
  const stable: Prisma.ListingOrderByWithRelationInput = { id: "desc" };

  switch (sort) {
    case "price_asc":  return [boostFirst, { price: "asc" }, stable];
    case "price_desc": return [boostFirst, { price: "desc" }, stable];
    case "popular":    return [boostFirst, { salesCount: "desc" }, { viewCount: "desc" }, stable];
    case "rating":     return [boostFirst, { ratingAvg: "desc" }, { reviewCount: "desc" }, stable];
    case "newest":
    default:           return [boostFirst, { createdAt: "desc" }, stable];
  }
}

// ─── Public reads ────────────────────────────────────────────────────

interface ListContext {
  /** The authenticated user, if any. Used to widen what they can see. */
  viewerId?: string;
  /** Moderators / admins see everything regardless of status. */
  viewerCanSeeAll?: boolean;
}

export async function listListings(
  query: ListingListQuery,
  ctx: ListContext = {},
): Promise<Page<ListingCard>> {
  const { take, skip, cursor, limit } = paginate(query);

  // Build the WHERE clause carefully: anyone listing publicly should
  // only see ACTIVE rows; the seller dashboard passes sellerId and may
  // pass status to look at their own drafts.
  const where: Prisma.ListingWhereInput = {};

  if (query.status) {
    const requestingOwn = ctx.viewerId && query.sellerId === ctx.viewerId;
    if (!ctx.viewerCanSeeAll && !requestingOwn) {
      // Non-owners can't peek at someone else's drafts/rejected items.
      throw AppError.forbidden("Cannot filter by status on another seller's listings");
    }
    where.status = query.status;
  } else if (!ctx.viewerCanSeeAll) {
    where.status = ListingStatus.ACTIVE;
  }

  if (query.gameId) where.gameId = query.gameId;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.type) where.type = query.type;
  if (query.platform) where.platform = query.platform;
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.ratingMin) where.ratingAvg = { gte: query.ratingMin };

  // gameSlug shortcut for the marketplace by-game pages
  if (query.gameSlug && !query.gameId) {
    where.game = { slug: query.gameSlug };
  }

  if (query.priceMin != null || query.priceMax != null) {
    where.price = {};
    if (query.priceMin != null) where.price.gte = query.priceMin;
    if (query.priceMax != null) where.price.lte = query.priceMax;
  }

  if (query.q) {
    // Postgres ILIKE; `mode: insensitive` requires the column or a
    // global setting, but Prisma's `contains: ..., mode: 'insensitive'`
    // is fine across most locales for our short titles + tags.
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
      { tags: { has: query.q.toLowerCase() } },
    ];
  }

  const rows = await prisma.listing.findMany({
    where,
    orderBy: orderByFor(query.sort),
    take,
    skip,
    cursor,
    include: LISTING_LIST_INCLUDE,
  });
  return buildPage(rows, limit, (r) => r.id);
}

export async function searchSuggest(q: string, limit = 6): Promise<Array<{ id: string; slug: string; title: string }>> {
  // Prefix match first (fast and intuitive) — fall back to substring
  // if we don't fill the limit.
  const prefix = await prisma.listing.findMany({
    where: { status: ListingStatus.ACTIVE, title: { startsWith: q, mode: "insensitive" } },
    orderBy: [{ salesCount: "desc" }, { viewCount: "desc" }],
    take: limit,
    select: { id: true, slug: true, title: true },
  });
  if (prefix.length >= limit) return prefix;

  const remaining = limit - prefix.length;
  const seen = new Set(prefix.map((p) => p.id));
  const fuzzy = await prisma.listing.findMany({
    where: {
      status: ListingStatus.ACTIVE,
      id: { notIn: prefix.map((p) => p.id) },
      title: { contains: q, mode: "insensitive" },
    },
    orderBy: [{ salesCount: "desc" }, { viewCount: "desc" }],
    take: remaining,
    select: { id: true, slug: true, title: true },
  });
  return [...prefix, ...fuzzy.filter((f) => !seen.has(f.id))];
}

/**
 * Fetch a single listing by slug, increment its view counter, and
 * return the detail payload. The view increment is fire-and-forget at
 * the SQL level (no `await`) so we don't slow down the page render
 * waiting for it.
 */
export async function getListingBySlug(
  slug: string,
  ctx: ListContext = {},
): Promise<ListingDetail> {
  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: LISTING_DETAIL_INCLUDE,
  });
  if (!listing) throw AppError.notFound("Listing");

  // Visibility rules: anyone can see ACTIVE; seller and mods can see
  // everything; everyone else gets 404 (better than 403 — don't leak
  // existence of hidden listings).
  const isOwner = ctx.viewerId === listing.sellerId;
  const visible = listing.status === ListingStatus.ACTIVE || isOwner || ctx.viewerCanSeeAll;
  if (!visible) throw AppError.notFound("Listing");

  // View counter — bump only when a non-owner views an active listing.
  // Owners viewing their own page or mods inspecting drafts shouldn't
  // inflate stats.
  if (!isOwner && listing.status === ListingStatus.ACTIVE) {
    void prisma.listing
      .update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => undefined);
  }

  return listing;
}

export async function getRelated(listingId: string, limit = 6): Promise<ListingCard[]> {
  const root = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, gameId: true, categoryId: true, type: true, sellerId: true },
  });
  if (!root) throw AppError.notFound("Listing");

  // Strategy: same game and same type, exclude self and the same seller.
  // Order by rating then sales — surface trustworthy, popular alternatives.
  return prisma.listing.findMany({
    where: {
      id: { not: root.id },
      status: ListingStatus.ACTIVE,
      type: root.type,
      ...(root.gameId ? { gameId: root.gameId } : {}),
      sellerId: { not: root.sellerId },
    },
    orderBy: [{ ratingAvg: "desc" }, { salesCount: "desc" }, { id: "desc" }],
    take: limit,
    include: LISTING_LIST_INCLUDE,
  });
}

export async function getFeatured(limit = 12): Promise<ListingCard[]> {
  return prisma.listing.findMany({
    where: { status: ListingStatus.ACTIVE, boostedUntil: { gt: new Date() } },
    orderBy: [{ ratingAvg: "desc" }, { salesCount: "desc" }, { id: "desc" }],
    take: limit,
    include: LISTING_LIST_INCLUDE,
  });
}

// ─── Mutations ───────────────────────────────────────────────────────

/**
 * Create a new listing as a draft. We never put a brand-new listing
 * straight to ACTIVE — moderation in PR#8 will toggle that. For now we
 * leave it as DRAFT and let the seller flip it to ACTIVE via the
 * publish endpoint (until moderation is wired, ACTIVE is allowed).
 */
export async function createListing(
  sellerId: string,
  input: ListingCreateInput,
): Promise<ListingDetail> {
  validateDeliveryShape(input);

  return prisma.$transaction(async (tx) => {
    const slug = await uniqueSlug(input.title, tx);

    // Coerce stock from delivery codes if present.
    const effectiveStock =
      input.deliveryMode === "AUTO" && input.deliveryCodes
        ? input.deliveryCodes.length
        : input.stockQty;

    const created = await tx.listing.create({
      data: {
        sellerId,
        title: input.title,
        description: input.description,
        type: input.type,
        gameId: input.gameId,
        categoryId: input.categoryId,
        slug,
        currency: input.currency,
        price: input.price,
        compareAtPrice: input.compareAtPrice,
        bulkDiscount: input.bulkDiscount,
        stockQty: effectiveStock,
        unlimited: input.unlimited,
        deliveryMode: input.deliveryMode,
        deliveryPayload:
          input.deliveryMode === "AUTO" && input.deliveryCodes
            ? // PR#10 will encrypt; for now store as plain JSON so the
              // shape is settled and the schema migration is free.
              { codes: input.deliveryCodes }
            : undefined,
        platform: input.platform,
        serverName: input.serverName,
        tags: input.tags ?? [],
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        // New listings start ACTIVE for now. Once admin moderation
        // (PR#8) lands, default flips to PENDING_REVIEW.
        status: ListingStatus.ACTIVE,
      },
      include: LISTING_DETAIL_INCLUDE,
    });
    return created;
  });
}

export async function updateListing(
  sellerId: string,
  listingId: string,
  input: ListingUpdateInput,
  isMod = false,
): Promise<ListingDetail> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.listing.findUnique({ where: { id: listingId } });
    if (!existing) throw AppError.notFound("Listing");
    if (existing.sellerId !== sellerId && !isMod) throw AppError.forbidden();

    validateDeliveryShape({ ...existing, ...input } as ListingCreateInput);

    // If the title changed, re-slugify so the URL reflects the new title.
    // Old slug stays unique by virtue of uniqueSlug() walking the tail.
    let slug = existing.slug;
    if (input.title && input.title !== existing.title) {
      slug = await uniqueSlug(input.title, tx);
    }

    const data: Prisma.ListingUpdateInput = {
      title: input.title,
      description: input.description,
      gameId: input.gameId !== undefined ? (input.gameId ? { connect: { id: input.gameId } } : { disconnect: true }) : undefined,
      categoryId: input.categoryId !== undefined ? (input.categoryId ? { connect: { id: input.categoryId } } : { disconnect: true }) : undefined,
      type: input.type,
      slug,
      currency: input.currency,
      price: input.price,
      compareAtPrice: input.compareAtPrice ?? undefined,
      bulkDiscount: input.bulkDiscount as Prisma.InputJsonValue | undefined,
      stockQty: input.stockQty,
      unlimited: input.unlimited,
      deliveryMode: input.deliveryMode,
      deliveryPayload:
        input.deliveryMode === "AUTO" && input.deliveryCodes
          ? { codes: input.deliveryCodes }
          : undefined,
      platform: input.platform,
      serverName: input.serverName,
      tags: input.tags,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    };

    return tx.listing.update({
      where: { id: listingId },
      data,
      include: LISTING_DETAIL_INCLUDE,
    });
  });
}

/**
 * Soft delete: flip status to ARCHIVED so historical orders remain
 * navigable. Hard deletion would cascade through OrderItem/Review
 * snapshots and break audit trails.
 */
export async function archiveListing(sellerId: string, listingId: string, isMod = false): Promise<void> {
  const existing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true, sellerId: true } });
  if (!existing) throw AppError.notFound("Listing");
  if (existing.sellerId !== sellerId && !isMod) throw AppError.forbidden();
  await prisma.listing.update({ where: { id: listingId }, data: { status: ListingStatus.ARCHIVED } });
}

export async function setListingStatus(
  sellerId: string,
  listingId: string,
  input: ListingPublishInput,
): Promise<ListingDetail> {
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing) throw AppError.notFound("Listing");
  if (existing.sellerId !== sellerId) throw AppError.forbidden();
  return prisma.listing.update({
    where: { id: listingId },
    data: { status: input.status },
    include: LISTING_DETAIL_INCLUDE,
  });
}

export async function duplicateListing(sellerId: string, listingId: string): Promise<ListingDetail> {
  const src = await prisma.listing.findUnique({
    where: { id: listingId },
    include: { images: true },
  });
  if (!src) throw AppError.notFound("Listing");
  if (src.sellerId !== sellerId) throw AppError.forbidden();

  return prisma.$transaction(async (tx) => {
    const slug = await uniqueSlug(`${src.title} copy`, tx);
    const dup = await tx.listing.create({
      data: {
        sellerId,
        title: `${src.title} (copy)`,
        slug,
        description: src.description,
        type: src.type,
        gameId: src.gameId,
        categoryId: src.categoryId,
        currency: src.currency,
        price: src.price,
        compareAtPrice: src.compareAtPrice,
        bulkDiscount: src.bulkDiscount as Prisma.InputJsonValue,
        stockQty: 0, // duplicates start without inventory; seller adds codes
        unlimited: src.unlimited,
        deliveryMode: src.deliveryMode,
        platform: src.platform,
        serverName: src.serverName,
        tags: src.tags,
        metaTitle: src.metaTitle,
        metaDescription: src.metaDescription,
        status: ListingStatus.DRAFT,
        // Image rows are copied; same URLs are reused (storage is shared).
        images: {
          create: src.images.map((i) => ({
            url: i.url,
            width: i.width,
            height: i.height,
            position: i.position,
            isCover: i.isCover,
          })),
        },
      },
      include: LISTING_DETAIL_INCLUDE,
    });
    return dup;
  });
}

export async function boostListing(
  sellerId: string,
  listingId: string,
  input: ListingBoostInput,
): Promise<ListingDetail> {
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing) throw AppError.notFound("Listing");
  if (existing.sellerId !== sellerId) throw AppError.forbidden();

  // Extend from the later of: now, or the current boostedUntil. This
  // means stacking a 24h boost on a listing that already has 12h left
  // gives 36h total, not 24h.
  const base = existing.boostedUntil && existing.boostedUntil > new Date() ? existing.boostedUntil : new Date();
  const newUntil = new Date(base.getTime() + input.hours * 60 * 60 * 1000);

  // PR#10 will charge the seller's wallet for the boost; for now it's free.
  return prisma.listing.update({
    where: { id: listingId },
    data: { boostedUntil: newUntil },
    include: LISTING_DETAIL_INCLUDE,
  });
}

export async function reportListing(
  reporterId: string,
  listingId: string,
  input: ListingReportInput,
): Promise<{ id: string }> {
  const exists = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } });
  if (!exists) throw AppError.notFound("Listing");
  const created = await prisma.report.create({
    data: {
      reporterId,
      target: ReportTarget.LISTING,
      listingId,
      reason: input.reason,
      details: input.details,
      status: ReportStatus.PENDING,
    },
    select: { id: true },
  });
  return created;
}

// ─── Catalog (games, categories) ─────────────────────────────────────

export async function listGames() {
  return prisma.game.findMany({
    orderBy: [{ popularity: "desc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      publisher: true,
      coverUrl: true,
      iconUrl: true,
      platforms: true,
      popularity: true,
    },
  });
}

interface CategoryNode {
  id: string;
  slug: string;
  title: string;
  iconName: string | null;
  position: number;
  children: CategoryNode[];
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  // One query, then assemble the tree in memory — saves recursive SQL
  // and there are at most a few hundred categories.
  const all = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      iconName: true,
      position: true,
      parentId: true,
    },
  });

  const byId = new Map<string, CategoryNode>();
  for (const c of all) {
    byId.set(c.id, { id: c.id, slug: c.slug, title: c.title, iconName: c.iconName, position: c.position, children: [] });
  }
  const roots: CategoryNode[] = [];
  for (const c of all) {
    const node = byId.get(c.id)!;
    if (c.parentId) {
      const parent = byId.get(c.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node); // orphans surface as roots so they're discoverable
    } else {
      roots.push(node);
    }
  }
  return roots;
}

// ─── Internal helpers ────────────────────────────────────────────────

/**
 * Cross-field rule: AUTO delivery requires either explicit
 * `deliveryCodes` or `unlimited` (the latter applies to digital
 * services that can be issued algorithmically). MANUAL/SCHEDULED can
 * have any stock count.
 */
function validateDeliveryShape(input: Pick<ListingCreateInput, "deliveryMode" | "deliveryCodes" | "unlimited" | "stockQty">): void {
  if (input.deliveryMode !== "AUTO") return;
  const hasCodes = input.deliveryCodes && input.deliveryCodes.length > 0;
  if (!input.unlimited && !hasCodes) {
    throw AppError.badRequest("AUTO delivery requires deliveryCodes or unlimited=true");
  }
}
