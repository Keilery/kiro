/**
 * Frontend API client.
 *
 * Thin fetch wrapper around the Express backend (PR#2 + PR#3).
 *
 * Why this is a hand-written wrapper rather than a generated SDK:
 *   - The backend's OpenAPI doc isn't pinned yet (PR#12 will pin it)
 *     so a generator would churn every PR.
 *   - The wrapper is small and gives us one place to handle:
 *       * the env-driven base URL (works in Server + Client components)
 *       * Bearer-token injection from the auth store
 *       * the canonical error envelope { error: { code, message, ... } }
 *       * 401 → automatic refresh + single retry
 *
 * Anything that needs to talk to /api/v1 should go through `api.*`.
 * Components should never import `fetch` directly.
 */

import type { ListingPage, ListingDetail, ListingCard, Game, CategoryNode } from "./types";

// ─── Base URL resolution ──────────────────────────────────────────────

/**
 * In dev the API runs on a different port from Next (4000 vs 3000).
 * In production the same domain is fine. We resolve via env var so the
 * same component code works server-side (Node) and client-side (browser):
 *
 *   NEXT_PUBLIC_API_BASE — exposed to the browser (e.g. http://localhost:4000)
 *   API_BASE_INTERNAL    — server-side only (e.g. http://api:4000 in Docker)
 *
 * Falls back to localhost so `npm run dev` works with zero config.
 */
function resolveBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_BASE_INTERNAL ?? process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
  }
  return process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
}

// ─── Error envelope ───────────────────────────────────────────────────

/**
 * Mirrors the AppError shape from backend/middleware/error.ts. Every
 * non-2xx response is normalized to this so callers don't have to
 * special-case fetch's "ok" boolean vs JSON parsing failures.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(opts: { code: string; message: string; status: number; details?: unknown; requestId?: string }) {
    super(opts.message);
    this.name = "ApiError";
    this.code = opts.code;
    this.status = opts.status;
    this.details = opts.details;
    this.requestId = opts.requestId;
  }
}

// ─── Token plumbing ───────────────────────────────────────────────────

/**
 * The auth store (defined in lib/auth-store.ts) registers a token
 * provider here so the api module doesn't have to import the store
 * directly — that would create a cycle (store → api → store).
 *
 * Each request reads the latest tokens through this getter rather
 * than capturing them at construction; that way logout / refresh
 * take effect on the very next request without a page reload.
 */
type Tokens = { accessToken: string | null; refreshToken: string | null };
let tokenProvider: () => Tokens = () => ({ accessToken: null, refreshToken: null });
let tokenSetter: (t: Tokens) => void = () => {};
let tokenClearer: () => void = () => {};

export function registerTokenSource(opts: {
  getTokens: () => Tokens;
  setTokens: (t: Tokens) => void;
  clearTokens: () => void;
}): void {
  tokenProvider = opts.getTokens;
  tokenSetter = opts.setTokens;
  tokenClearer = opts.clearTokens;
}

// ─── Refresh coordination ─────────────────────────────────────────────

/**
 * Coalesce concurrent refresh attempts. If 3 listing requests fire
 * a 401 at the same time we should hit /auth/refresh once and have
 * all 3 retries reuse that response — otherwise the second attempt
 * sees the now-rotated refresh token as "reused" and the backend
 * (correctly) revokes every session for the user.
 */
let inflightRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (inflightRefresh) return inflightRefresh;
  const { refreshToken } = tokenProvider();
  if (!refreshToken) return null;

  inflightRefresh = (async () => {
    try {
      const res = await fetch(`${resolveBaseUrl()}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        // Refresh itself failed — wipe tokens; the next call will be 401
        // and the UI's auth guard can route to /auth/login.
        tokenClearer();
        return null;
      }
      const json = (await res.json()) as { accessToken: string; refreshToken: string };
      tokenSetter({ accessToken: json.accessToken, refreshToken: json.refreshToken });
      return json.accessToken;
    } catch {
      tokenClearer();
      return null;
    } finally {
      inflightRefresh = null;
    }
  })();
  return inflightRefresh;
}

// ─── Core request ─────────────────────────────────────────────────────

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Query params; values are URL-encoded; null/undefined are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Set true to skip token injection (e.g. /auth/login). */
  anonymous?: boolean;
  /**
   * Forward Next.js fetch caching hints. `no-store` is the safe default
   * for anything tied to the authenticated user; list pages opt into
   * `revalidate: N` explicitly.
   */
  next?: { revalidate?: number; tags?: string[] };
  cache?: RequestCache;
  /** Abort signal — wired through so callers can cancel inflight reqs. */
  signal?: AbortSignal;
}

async function request<T>(path: string, opts: RequestOptions = {}, isRetry = false): Promise<T> {
  const url = buildUrl(path, opts.query);

  const headers: Record<string, string> = { accept: "application/json" };
  if (opts.body !== undefined) headers["content-type"] = "application/json";

  if (!opts.anonymous) {
    const { accessToken } = tokenProvider();
    if (accessToken) headers.authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: opts.cache,
    next: opts.next,
    signal: opts.signal,
  });

  // 401 → try one refresh + retry. We only retry once to avoid loops.
  if (res.status === 401 && !opts.anonymous && !isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, opts, true);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  // Body might not be JSON (e.g. /metrics returns text/plain). Try to
  // parse but don't crash if it isn't valid JSON — we'll surface a
  // generic error envelope instead.
  const text = await res.text();
  let parsed: unknown = null;
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  if (!res.ok) {
    const env = (parsed as { error?: { code?: string; message?: string; details?: unknown; requestId?: string } } | null)?.error;
    throw new ApiError({
      code: env?.code ?? `HTTP_${res.status}`,
      message: env?.message ?? `${res.status} ${res.statusText}`,
      status: res.status,
      details: env?.details,
      requestId: env?.requestId ?? res.headers.get("x-request-id") ?? undefined,
    });
  }

  return parsed as T;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = resolveBaseUrl();
  // Tolerate both "/api/v1/listings" and absolute paths so callers
  // don't have to worry about which of the two they typed.
  const url = new URL(path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === null || v === undefined || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

// ─── Public surface ───────────────────────────────────────────────────

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────
  auth: {
    login(input: { identifier: string; password: string }) {
      return request<{ user: PublicUser; accessToken: string; refreshToken: string }>(
        "/api/v1/auth/login",
        { method: "POST", body: input, anonymous: true },
      );
    },
    register(input: { email: string; username: string; password: string; displayName?: string; referralCode?: string }) {
      return request<{ user: PublicUser; accessToken: string; refreshToken: string }>(
        "/api/v1/auth/register",
        { method: "POST", body: input, anonymous: true },
      );
    },
    logout(input?: { refreshToken?: string; allDevices?: boolean }) {
      return request<{ revoked: number }>("/api/v1/auth/logout", { method: "POST", body: input ?? {} });
    },
    me() {
      return request<{ user: PublicUser }>("/api/v1/auth/me");
    },
  },

  // ── Marketplace catalog ───────────────────────────────────────────
  catalog: {
    games() {
      return request<{ games: Game[] }>("/api/v1/marketplace/games", { next: { revalidate: 300 } });
    },
    categories() {
      return request<{ categories: CategoryNode[] }>("/api/v1/marketplace/categories", { next: { revalidate: 300 } });
    },
  },

  // ── Marketplace listings ──────────────────────────────────────────
  listings: {
    list(query: ListingListInput, signal?: AbortSignal) {
      return request<ListingPage>("/api/v1/marketplace/listings", {
        query: query as never,
        signal,
        // Listings change frequently; keep the response fresh for ~30s.
        next: { revalidate: 30, tags: ["listings"] },
      });
    },
    get(slug: string, signal?: AbortSignal) {
      return request<{ listing: ListingDetail }>(`/api/v1/marketplace/listings/${encodeURIComponent(slug)}`, {
        signal,
        next: { revalidate: 30, tags: [`listing:${slug}`] },
      });
    },
    related(slug: string, signal?: AbortSignal) {
      return request<{ listings: ListingCard[] }>(`/api/v1/marketplace/listings/${encodeURIComponent(slug)}/related`, {
        signal,
        next: { revalidate: 60 },
      });
    },
    suggest(q: string, limit = 6, signal?: AbortSignal) {
      return request<{ suggestions: Array<{ id: string; slug: string; title: string }> }>(
        "/api/v1/marketplace/listings/search",
        { query: { q, limit }, signal, cache: "no-store" },
      );
    },
    featured(signal?: AbortSignal) {
      return request<{ listings: ListingCard[] }>("/api/v1/marketplace/listings/featured", {
        signal,
        next: { revalidate: 60 },
      });
    },
  },

  // ── Marketplace reviews ───────────────────────────────────────────
  reviews: {
    forListing(id: string, query: { cursor?: string; limit?: number; ratingMin?: number } = {}, signal?: AbortSignal) {
      return request<ReviewPage>(`/api/v1/marketplace/listings/${encodeURIComponent(id)}/reviews`, {
        query,
        signal,
        next: { revalidate: 30 },
      });
    },
    create(input: { orderId: string; rating: number; body?: string; imageUrls?: string[] }) {
      return request<{ review: Review }>("/api/v1/marketplace/reviews", { method: "POST", body: input });
    },
  },
};

// ─── Lightweight DTO mirrors ──────────────────────────────────────────
// We don't import server types directly — this keeps the frontend
// build self-contained and lets the OpenAPI generator (PR#12) replace
// these without touching every component.

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: "USER" | "SELLER" | "MODERATOR" | "ADMIN" | "SUPERADMIN";
  status: "ACTIVE" | "MUTED" | "BANNED" | "PENDING_VERIFICATION";
  emailVerifiedAt: string | null;
  avatarUrl: string | null;
}

export interface ListingListInput {
  cursor?: string;
  limit?: number;
  q?: string;
  gameId?: string;
  gameSlug?: string;
  categoryId?: string;
  type?: "ACCOUNT" | "KEY" | "SERVICE" | "ITEM" | "CURRENCY" | "BOOST" | "RENTAL";
  platform?: "PC" | "PLAYSTATION" | "XBOX" | "MOBILE" | "NINTENDO" | "CROSS_PLATFORM";
  sellerId?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "popular" | "rating";
}

export interface Review {
  id: string;
  rating: number;
  body: string | null;
  imageUrls: string[];
  sellerReply: string | null;
  sellerRepliedAt: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export interface ReviewPage {
  items: Review[];
  hasMore: boolean;
  nextCursor: string | null;
  limit: number;
}
