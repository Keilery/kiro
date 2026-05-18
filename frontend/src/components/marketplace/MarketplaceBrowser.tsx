"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ListingCard } from "./ListingCard";
import { ListingCardSkeleton } from "./ListingCardSkeleton";
import { FilterPanel, type MarketplaceFilters } from "./FilterPanel";
import { SortBar } from "./SortBar";
import { useInfiniteListings } from "@/lib/useInfiniteListings";
import type { Game, ListingSort, ListingType, Platform } from "@/lib/types";

/**
 * MarketplaceBrowser — the listing grid + filter rail + sort bar.
 *
 * Architecture:
 *   - URL is the source of truth for filters and sort. This means a
 *     deep-linked /marketplace?gameSlug=cs2&sort=price_asc renders
 *     the right state on first paint, and the user can share the
 *     filtered view by copying the URL.
 *   - Filter changes call router.replace() (not push) so the back
 *     button doesn't accumulate one entry per chip click.
 *   - The infinite-scroll observer attaches to a sentinel <div> below
 *     the grid; when it intersects the viewport we call loadMore().
 *
 * Render strategy:
 *   - During the very first fetch we render skeletons (no real data
 *     to show yet).
 *   - During refresh-on-filter-change we keep the old grid visible
 *     under a translucent overlay — a flash to empty would feel slow.
 *   - During load-more we keep all old data and append a small
 *     spinner row at the bottom.
 */

interface Props {
  games: Game[];
  /**
   * Initial filters resolved from search params on the server, used
   * only as the very first render's seed; from there on this
   * component owns the canonical filter state synced with the URL.
   */
  initialFilters: ResolvedFilters;
}

export interface ResolvedFilters {
  filters: MarketplaceFilters;
  sort: ListingSort;
}

export function MarketplaceBrowser({ games, initialFilters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local mirror of the URL state. We initialize from props so the
  // server-rendered HTML matches; subsequent updates flow URL → state
  // via the useEffect below, and state → URL via setFilters/setSort.
  const [filters, setFiltersState] = useState<MarketplaceFilters>(initialFilters.filters);
  const [sort, setSortState] = useState<ListingSort>(initialFilters.sort);

  // URL → state. Fires when the user navigates back/forward; the
  // identity check avoids a render storm because parsing the same
  // params yields a fresh object literal each time.
  useEffect(() => {
    const next = parseSearchParams(searchParams);
    setFiltersState((prev) => (sameFilters(prev, next.filters) ? prev : next.filters));
    setSortState((prev) => (prev === next.sort ? prev : next.sort));
  }, [searchParams]);

  // state → URL. Use replace so chip-spamming doesn't bloat history.
  function commitToUrl(next: { filters?: MarketplaceFilters; sort?: ListingSort }) {
    const f = next.filters ?? filters;
    const s = next.sort ?? sort;
    const sp = new URLSearchParams();
    if (f.q) sp.set("q", f.q);
    if (f.gameSlug) sp.set("gameSlug", f.gameSlug);
    if (f.type) sp.set("type", f.type);
    if (f.platform) sp.set("platform", f.platform);
    if (f.priceMin != null) sp.set("priceMin", String(f.priceMin));
    if (f.priceMax != null) sp.set("priceMax", String(f.priceMax));
    if (f.ratingMin != null) sp.set("ratingMin", String(f.ratingMin));
    if (s !== "newest") sp.set("sort", s);
    const qs = sp.toString();
    router.replace(qs ? `/marketplace?${qs}` : "/marketplace", { scroll: false });
  }

  function setFilters(next: MarketplaceFilters) {
    setFiltersState(next);
    commitToUrl({ filters: next });
  }
  function setSort(next: ListingSort) {
    setSortState(next);
    commitToUrl({ sort: next });
  }
  function resetFilters() {
    const empty: MarketplaceFilters = {};
    setFiltersState(empty);
    commitToUrl({ filters: empty });
  }

  // Build the API input from filters + sort. Memoized so the hook
  // doesn't refetch on parent re-renders that don't change either.
  const apiInput = useMemo(
    () => ({
      q: filters.q,
      gameSlug: filters.gameSlug,
      type: filters.type,
      platform: filters.platform,
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      ratingMin: filters.ratingMin,
      sort,
      // Default page size; the server caps at 100.
      limit: 24,
    }),
    [filters, sort],
  );

  const { items, initialLoading, refreshing, loadingMore, hasMore, error, loadMore, retry } =
    useInfiniteListings(apiInput);

  // ── Infinite-scroll sentinel ─────────────────────────────────────
  // IntersectionObserver fires loadMore as the bottom of the grid
  // approaches the viewport. rootMargin pulls the trigger 400px
  // before the actual sentinel so the new page lands just before the
  // user runs out of cards. Avoids the awkward "scroll, wait, scroll"
  // pattern that a 0px margin produces.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) loadMore();
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore]);

  // ── Render ────────────────────────────────────────────────────────
  const showSkeletons = initialLoading;
  const showEmpty = !initialLoading && !error && items.length === 0;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      {/* Filter rail. Sticky on lg+ so it stays in view as the grid
          scrolls; on mobile it just sits above the grid normally. */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <FilterPanel value={filters} games={games} onChange={setFilters} onReset={resetFilters} />
      </aside>

      <div className="min-w-0">
        <SortBar
          value={sort}
          onChange={setSort}
          total={initialLoading ? undefined : items.length + (hasMore ? 1 : 0)}
          className="mb-5"
        />

        {/* Grid. The relative wrapper hosts the refresh-overlay so it
            covers exactly the cards underneath. */}
        <div className="relative">
          {refreshing && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 rounded-ios bg-black/30 backdrop-blur-[2px]"
            />
          )}

          {showSkeletons ? (
            <SkeletonGrid />
          ) : showEmpty ? (
            <EmptyState onReset={resetFilters} />
          ) : error ? (
            <ErrorState message={error} onRetry={retry} />
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            >
              {items.map((listing, i) => (
                <ListingCard key={listing.id} listing={listing} index={i} />
              ))}
            </motion.div>
          )}
        </div>

        {/* Sentinel + load-more spinner. Render the sentinel only when
            there's more to load, otherwise it would keep firing once
            the user scrolls past the actual end. */}
        {hasMore && !error && !showEmpty && (
          <div ref={sentinelRef} className="mt-10 flex justify-center">
            {loadingMore ? <LoadMoreSpinner /> : <span className="h-10" aria-hidden />}
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className="mt-10 text-center text-[12.5px] text-white/40">
            Это всё. Кажется, вы посмотрели всё.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

/** Stable equality check used to avoid redundant state updates. */
function sameFilters(a: MarketplaceFilters, b: MarketplaceFilters): boolean {
  return (
    a.q === b.q &&
    a.gameSlug === b.gameSlug &&
    a.type === b.type &&
    a.platform === b.platform &&
    a.priceMin === b.priceMin &&
    a.priceMax === b.priceMax &&
    a.ratingMin === b.ratingMin
  );
}

/**
 * Parse URL search params into the resolved filter shape. Exported so
 * the page (server component) can compute initial filters before
 * rendering this client component.
 */
export function parseSearchParams(sp: URLSearchParams | ReadonlyURLSearchParams): ResolvedFilters {
  const raw = (k: string) => sp.get(k) ?? undefined;
  const num = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const enumOf = <T extends string>(k: string, allowed: readonly T[]): T | undefined => {
    const v = sp.get(k);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : undefined;
  };

  return {
    filters: {
      q: raw("q"),
      gameSlug: raw("gameSlug"),
      type: enumOf<ListingType>("type", [
        "ACCOUNT",
        "KEY",
        "SERVICE",
        "ITEM",
        "CURRENCY",
        "BOOST",
        "RENTAL",
      ]),
      platform: enumOf<Platform>("platform", [
        "PC",
        "PLAYSTATION",
        "XBOX",
        "MOBILE",
        "NINTENDO",
        "CROSS_PLATFORM",
      ]),
      priceMin: num("priceMin"),
      priceMax: num("priceMax"),
      ratingMin: num("ratingMin"),
    },
    sort:
      enumOf<ListingSort>("sort", ["newest", "popular", "price_asc", "price_desc", "rating"]) ??
      "newest",
  };
}

// ReadonlyURLSearchParams is what useSearchParams returns; widen so
// the helper accepts both that and a plain URLSearchParams.
type ReadonlyURLSearchParams = ReturnType<typeof useSearchParams>;

// ─── State views ──────────────────────────────────────────────────────

function SkeletonGrid() {
  // 8 skeletons fits two rows of 4 on xl, 4 of 2 on sm. Beyond that
  // the user never sees the lower rows because data lands.
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-ios border border-white/[0.07] bg-white/[0.02] py-16 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full border border-white/[0.10]">
        <span className="text-[20px]">∅</span>
      </div>
      <div className="text-[15px] font-medium text-white">Ничего не нашли</div>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-white/55">
        Попробуйте смягчить фильтры или поискать другую игру.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 rounded-full border border-white/15 px-4 py-2 text-[12.5px] text-white/85 transition-colors hover:border-white/30 hover:bg-white/[0.05] hover:text-white"
      >
        Сбросить фильтры
      </button>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-ios border border-rose-400/20 bg-rose-400/[0.04] py-16 text-center">
      <div className="text-[15px] font-medium text-rose-200">Не получилось загрузить листинги</div>
      <p className="mx-auto mt-1.5 max-w-md text-[13px] text-white/60">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full bg-white px-5 py-2 text-[12.5px] font-medium text-black"
      >
        Повторить
      </button>
    </div>
  );
}

function LoadMoreSpinner() {
  return (
    <div className="flex items-center gap-2 text-[12px] text-white/55">
      <span
        className="h-3 w-3 rounded-full border border-white/30 border-t-white/80"
        style={{ animation: "spin 800ms linear infinite" }}
      />
      Загружаем ещё
    </div>
  );
}
