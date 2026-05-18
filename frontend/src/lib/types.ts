/**
 * Frontend-side mirrors of the marketplace DTOs.
 *
 * Why these live separately from `lib/api.ts`:
 * api.ts is the runtime client; this file is pure type info. Components
 * import from here when they need shape only (props, hooks, type
 * narrowing) and from api.ts when they need to call something. Keeping
 * them apart lets the OpenAPI generator (PR#12) replace this file
 * wholesale without churning the call sites.
 *
 * Hand-maintained for PR#3+PR#4. Anything added to the backend's
 * OpenAPI doc must be reflected here until the generator lands.
 */

// ─── Enums ───────────────────────────────────────────────────────────

export type ListingType =
  | "ACCOUNT"
  | "KEY"
  | "SERVICE"
  | "ITEM"
  | "CURRENCY"
  | "BOOST"
  | "RENTAL";

export type ListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "PAUSED"
  | "SOLD_OUT"
  | "REJECTED"
  | "ARCHIVED";

export type DeliveryMode = "AUTO" | "MANUAL" | "SCHEDULED";

export type Currency = "RUB" | "USD" | "EUR" | "UAH";

export type Platform =
  | "PC"
  | "PLAYSTATION"
  | "XBOX"
  | "MOBILE"
  | "NINTENDO"
  | "CROSS_PLATFORM";

export type SellerTier = "NONE" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type ListingSort =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular"
  | "rating";

// ─── Catalog ─────────────────────────────────────────────────────────

export interface Game {
  id: string;
  slug: string;
  title: string;
  publisher: string | null;
  coverUrl: string | null;
  iconUrl: string | null;
  platforms: Platform[];
  popularity: number;
}

export interface CategoryNode {
  id: string;
  slug: string;
  title: string;
  iconName: string | null;
  position: number;
  children: CategoryNode[];
}

// ─── Listings ────────────────────────────────────────────────────────

export interface ListingImage {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  position: number;
  isCover: boolean;
}

export interface ListingSellerSummary {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl?: string | null;
  sellerTier: SellerTier;
  level?: number;
  createdAt?: string;
}

export interface ListingCard {
  id: string;
  slug: string;
  title: string;
  type: ListingType;
  status: ListingStatus;
  currency: Currency;
  /**
   * Decimal arrives as a string from the backend (Decimal.js → string).
   * Use Number(price) at render time when you need numeric ops; never
   * push it through Math.* mid-flight or you'll lose precision.
   */
  price: string;
  compareAtPrice: string | null;
  ratingAvg: number;
  reviewCount: number;
  salesCount: number;
  viewCount: number;
  boostedUntil: string | null;
  images: ListingImage[];
  game: { slug: string; title: string } | null;
  seller: ListingSellerSummary;
}

/**
 * ListingDetail extends ListingCard. We model it as an intersection
 * to mirror the OpenAPI `allOf` shape — TS structural typing accepts
 * the wider object anywhere a Card is expected.
 */
export interface ListingDetail extends ListingCard {
  description: string | null;
  tags: string[];
  platform: Platform | null;
  serverName: string | null;
  stockQty: number;
  unlimited: boolean;
  deliveryMode: DeliveryMode;
  category: { id: string; slug: string; title: string } | null;
}

// ─── Pagination ──────────────────────────────────────────────────────

export interface Page<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
}

export type ListingPage = Page<ListingCard>;
