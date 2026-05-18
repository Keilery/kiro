"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { Review } from "@/lib/api";

/**
 * Listing reviews block.
 *
 * Loads the first page of /listings/:id/reviews and lets the user
 * page through with a "Show more" button. We deliberately don't reuse
 * the infinite-scroll hook from the grid — reviews live below other
 * content, and an IntersectionObserver here would fight with the
 * grid's observer for "what's near the bottom of the page".
 *
 * Hidden reviews (mod-suppressed) are filtered server-side; the
 * `includeHidden` query param is gated to owner/mod and we never
 * pass it from this surface.
 */
export function ListingReviews({
  listingId,
  initialAvg,
  initialCount,
}: {
  listingId: string;
  initialAvg: number;
  initialCount: number;
}) {
  const [items, setItems] = useState<Review[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // First page on mount. Subsequent pages appended via showMore().
  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    api.reviews
      .forListing(listingId, { limit: 6 }, ac.signal)
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch((err: unknown) => {
        if (cancelled || (err as Error)?.name === "AbortError") return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Не удалось загрузить отзывы";
        setError(message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [listingId]);

  function showMore() {
    if (!cursor || loading) return;
    setLoading(true);
    api.reviews
      .forListing(listingId, { limit: 6, cursor })
      .then((res) => {
        setItems((prev) => [...prev, ...res.items]);
        setCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch((err: unknown) => {
        const message = err instanceof ApiError ? err.message : "Не удалось подгрузить отзывы";
        setError(message);
      })
      .finally(() => setLoading(false));
  }

  return (
    <section className="rounded-ios border border-white/[0.07] bg-white/[0.02] p-6">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1.5">Отзывы</div>
          <div className="flex items-baseline gap-2">
            <span className="num text-[26px] font-semibold text-white">
              {initialAvg.toFixed(2)}
            </span>
            <span className="text-[13px] text-white/55">
              {initialCount === 0
                ? "пока без отзывов"
                : `на основе ${initialCount} ${pluralReviews(initialCount)}`}
            </span>
          </div>
        </div>
        <Stars value={initialAvg} />
      </header>

      {/* Loaded items. We render even when loading=true so a "Show
          more" press doesn't blank the existing list. */}
      {items.length > 0 && (
        <ul className="space-y-5">
          {items.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      )}

      {/* Loading indicator on initial load only — when paginating we
          keep the existing list and disable the button instead. */}
      {loading && items.length === 0 && (
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <ReviewSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="rounded-md border border-white/[0.06] bg-white/[0.02] py-8 text-center text-[13px] text-white/55">
          У этого товара ещё нет отзывов. Будете первым?
        </div>
      )}

      {error && (
        <div className="rounded-md border border-rose-400/20 bg-rose-400/[0.04] py-3 px-4 text-[12.5px] text-rose-200">
          {error}
        </div>
      )}

      {hasMore && items.length > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            disabled={loading}
            onClick={showMore}
            className="rounded-full border border-white/[0.10] bg-white/[0.025] px-5 py-2 text-[13px] text-white/85 transition-colors hover:border-white/30 hover:bg-white/[0.05] disabled:opacity-50"
          >
            {loading ? "Загружаем…" : "Показать ещё"}
          </button>
        </div>
      )}
    </section>
  );
}

function ReviewItem({ review }: { review: Review }) {
  return (
    <li className="border-b border-white/[0.06] pb-5 last:border-b-0 last:pb-0">
      <div className="flex items-center gap-2.5">
        <Avatar
          initial={(review.author.displayName ?? review.author.username).slice(0, 1).toUpperCase()}
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] text-white">
            {review.author.displayName ?? review.author.username}
          </div>
          <div className="text-[11.5px] text-white/45">{formatRelative(review.createdAt)}</div>
        </div>
        <Stars value={review.rating} compact />
      </div>
      {review.body && (
        <p className="mt-3 text-[13.5px] leading-relaxed text-white/[0.78]">{review.body}</p>
      )}
      {review.imageUrls && review.imageUrls.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {review.imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="h-20 w-28 shrink-0 rounded-md border border-white/[0.06] object-cover"
              loading="lazy"
            />
          ))}
        </div>
      )}
      {review.sellerReply && (
        <div className="mt-3 rounded-md border-l-2 border-white/15 bg-white/[0.02] py-2 pl-3 text-[12.5px] text-white/65">
          <div className="mb-0.5 text-[11px] uppercase tracking-wider text-white/40">
            Ответ продавца
          </div>
          {review.sellerReply}
        </div>
      )}
    </li>
  );
}

function ReviewSkeleton() {
  return (
    <div className="border-b border-white/[0.06] pb-5 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-full bg-white/[0.05]" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-32 rounded bg-white/[0.05]" />
          <div className="h-2.5 w-20 rounded bg-white/[0.04]" />
        </div>
      </div>
      <div className="mt-3 h-2.5 w-[80%] rounded bg-white/[0.04]" />
      <div className="mt-1.5 h-2.5 w-[60%] rounded bg-white/[0.04]" />
    </div>
  );
}

/**
 * Star row. Renders 5 outlines + N filled (rounded down). The
 * fractional half-star UX isn't worth the extra SVG mask plumbing
 * here; "★ 4.92" already appears in the header and on cards.
 */
function Stars({ value, compact }: { value: number; compact?: boolean }) {
  const filled = Math.round(value);
  const size = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={size + (i < filled ? " fill-amber-300 text-amber-300" : " text-white/20")}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </div>
  );
}

function Avatar({ initial }: { initial: string }) {
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/[0.10] bg-white/[0.04] text-[13px] font-medium text-white/85">
      {initial}
    </div>
  );
}

/**
 * Cheap relative-time formatter. Avoids pulling in date-fns for the
 * five strings we render. Falls back to an ISO date for anything
 * older than ~1 month.
 */
function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return "—";
    const diff = Date.now() - then;
    const min = 60_000;
    const hour = 60 * min;
    const day = 24 * hour;
    if (diff < hour) return "только что";
    if (diff < day) return `${Math.floor(diff / hour)} ч назад`;
    if (diff < 7 * day) return `${Math.floor(diff / day)} дн назад`;
    if (diff < 30 * day) return `${Math.floor(diff / (7 * day))} нед назад`;
    return new Date(then).toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

function pluralReviews(n: number): string {
  // Russian pluralization for "отзыв". We don't pull in i18n yet
  // (PR#14), so keep this inline.
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "отзыва";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "отзывов";
  return "отзывов";
}
