"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { api, ApiError, type ListingListInput } from "./api";
import type { ListingCard, ListingPage } from "./types";

/**
 * useInfiniteListings — pagination state + fetch coordination for the
 * marketplace grid.
 *
 * Why a custom reducer instead of TanStack Query / SWR:
 *   - TanStack Query's infinite-query API would work, but it costs
 *     ~12kB and we only need *one* infinite list in v1. The reducer
 *     here is ~100 lines and covers the exact behaviour we want.
 *   - We need three states distinguishable in the UI: initial loading
 *     (skeletons), refetch-on-filter-change (overlay spinner over old
 *     data so the user doesn't see a flash to empty), and load-more
 *     (small inline spinner at the tail). A library would do this too
 *     but obscures the moments where each fires.
 *
 * Race-correctness:
 *   Each fetch carries an AbortController; when filters change we abort
 *   any inflight request before issuing the next one. Without that, a
 *   fast user who types `q=cs2`, then `q=cs2 knife` could see the
 *   first response land *after* the second and overwrite it.
 */

interface State {
  items: ListingCard[];
  nextCursor: string | null;
  hasMore: boolean;
  /** True only on the very first fetch — drives skeleton vs overlay. */
  initialLoading: boolean;
  /** True while filters change is fetching but old items remain. */
  refreshing: boolean;
  /** True while the bottom sentinel has fired and we're appending. */
  loadingMore: boolean;
  error: string | null;
}

const INITIAL: State = {
  items: [],
  nextCursor: null,
  hasMore: true,
  initialLoading: true,
  refreshing: false,
  loadingMore: false,
  error: null,
};

type Action =
  | { type: "filters/changed" }
  | { type: "fetch/begin"; mode: "initial" | "refresh" | "more" }
  | { type: "fetch/success"; page: ListingPage; mode: "initial" | "refresh" | "more" }
  | { type: "fetch/error"; message: string }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "fetch/begin":
      return {
        ...state,
        error: null,
        initialLoading: action.mode === "initial",
        refreshing: action.mode === "refresh",
        loadingMore: action.mode === "more",
      };
    case "fetch/success": {
      // "more" appends. "initial" and "refresh" replace — refresh keeps
      // its previous items only until the success lands here, so the
      // user sees old → new without a blank moment.
      const items = action.mode === "more" ? [...state.items, ...action.page.items] : action.page.items;
      return {
        ...state,
        items,
        nextCursor: action.page.nextCursor,
        hasMore: action.page.hasMore,
        initialLoading: false,
        refreshing: false,
        loadingMore: false,
        error: null,
      };
    }
    case "fetch/error":
      return {
        ...state,
        error: action.message,
        initialLoading: false,
        refreshing: false,
        loadingMore: false,
      };
    case "reset":
      return { ...INITIAL };
    case "filters/changed":
      return { ...state, hasMore: true, nextCursor: null };
    default:
      return state;
  }
}

export interface UseInfiniteListingsResult {
  items: ListingCard[];
  initialLoading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  /** Imperative load-more — wired to the IntersectionObserver in the page. */
  loadMore: () => void;
  /** Imperative reload — used by retry button after errors. */
  retry: () => void;
}

export function useInfiniteListings(filters: ListingListInput): UseInfiniteListingsResult {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // We stringify filters as the dep key. Doing so avoids re-running the
  // effect when filters is a new object literal but with identical
  // values (parent re-renders).
  const filtersKey = JSON.stringify(filters);

  // Latest abort controller — replaced on every filter change.
  const abortRef = useRef<AbortController | null>(null);
  // Latest filters in a ref so loadMore() reads them without re-binding.
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  // Cursor in a ref for the same reason — we want loadMore's identity
  // stable so the IntersectionObserver doesn't reattach on every render.
  const cursorRef = useRef<string | null>(null);
  cursorRef.current = state.nextCursor;
  const hasMoreRef = useRef(true);
  hasMoreRef.current = state.hasMore;
  const inflightRef = useRef(false);

  /** Fetch one page. `mode` decides which spinner the UI shows. */
  const fetchPage = useCallback(async (mode: "initial" | "refresh" | "more") => {
    if (inflightRef.current) return; // guard against double-fires
    inflightRef.current = true;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    dispatch({ type: "fetch/begin", mode });
    try {
      const page = await api.listings.list(
        {
          ...filtersRef.current,
          // For "more" we attach the cursor; otherwise we ignore any
          // cursor that might have come in through filters.
          cursor: mode === "more" ? cursorRef.current ?? undefined : undefined,
        },
        ac.signal,
      );
      // If the request that just resolved is no longer the latest one,
      // bail without dispatching — abort() above should already have
      // prevented this, but the abort flag is checked between awaits
      // and can still race in some browsers.
      if (ac.signal.aborted) return;
      dispatch({ type: "fetch/success", page, mode });
    } catch (err) {
      // Aborted requests aren't real errors; the user-initiated newer
      // request will report on its own.
      if ((err as Error)?.name === "AbortError") return;
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Не удалось загрузить листинги";
      dispatch({ type: "fetch/error", message });
    } finally {
      inflightRef.current = false;
    }
  }, []);

  // Filters change → discard old cursor, refetch from page 1.
  // First mount fires this with mode="initial", subsequent with "refresh".
  const isFirstRunRef = useRef(true);
  useEffect(() => {
    const mode = isFirstRunRef.current ? "initial" : "refresh";
    isFirstRunRef.current = false;
    dispatch({ type: "filters/changed" });
    void fetchPage(mode);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filtersKey is the canonical dep
  }, [filtersKey, fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMoreRef.current || inflightRef.current) return;
    void fetchPage("more");
  }, [fetchPage]);

  const retry = useCallback(() => {
    void fetchPage("initial");
  }, [fetchPage]);

  return {
    items: state.items,
    initialLoading: state.initialLoading,
    refreshing: state.refreshing,
    loadingMore: state.loadingMore,
    hasMore: state.hasMore,
    error: state.error,
    loadMore,
    retry,
  };
}
