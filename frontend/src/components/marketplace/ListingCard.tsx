"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import type { ListingCard as ListingCardType } from "@/lib/types";

/**
 * Marketplace listing card.
 *
 * Single source of truth for "what one listing looks like in a grid".
 * Used by the marketplace page, the related-listings rail on detail
 * pages, and (eventually) the homepage preview when we replace the
 * static MarketplacePreview with the real API.
 *
 * Design choices:
 *   - Whole card is one anchor — clicking anywhere navigates. The Buy
 *     button is a visual affordance only; checkout flows live on the
 *     detail page where stock/promo/notes can be confirmed.
 *   - Currency formatting is intentionally manual rather than Intl.
 *     The backend already returns prices as strings (Decimal-safe) and
 *     ru-RU's locale spaces aren't well-supported across older Safari.
 *     We split thousands ourselves and pin the symbol per currency.
 *   - Image area is a tinted radial gradient when no image — better
 *     than a broken-image icon, and reads as "intentional placeholder".
 */
export function ListingCard({
  listing,
  index = 0,
  withMotion = true,
}: {
  listing: ListingCardType;
  /** Used only when `withMotion` to stagger the entrance. */
  index?: number;
  withMotion?: boolean;
}) {
  const cover = listing.images.find((i) => i.isCover) ?? listing.images[0];
  const isBoosted = listing.boostedUntil && new Date(listing.boostedUntil) > new Date();

  const Wrapper = withMotion ? motion.div : "div";
  const motionProps = withMotion
    ? {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-60px" },
        transition: {
          type: "spring" as const,
          stiffness: 110,
          damping: 22,
          // Stagger ramps fast then plateaus — past 8 cards the user
          // scrolls before the entrance finishes anyway.
          delay: Math.min(index * 0.05, 0.4),
        },
      }
    : {};

  return (
    <Wrapper {...motionProps}>
      <Link href={`/marketplace/${listing.slug}`} aria-label={listing.title} className="block h-full">
        <GlassPanel className="group flex h-full flex-col p-5 transition-all duration-500 ease-out-expo hover:bg-white/[0.075]">
          {/* Cover image area */}
          <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-ios-sm border border-white/[0.08] bg-white/[0.03]">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- next/image needs domain config; deferred to PR#15
              <img
                src={cover.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
                onError={(e) => {
                  // If the cdn URL 404s (common in dev / before PR#15
                  // wires real S3), fall back to the gradient placeholder
                  // by hiding the broken img.
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : null}
            {/* Gradient placeholder. Always rendered behind the img so
                the load-flash and the error fallback both look the same. */}
            <div
              aria-hidden
              className="absolute inset-0 -z-10 opacity-60"
              style={{
                background:
                  "radial-gradient(70% 60% at 30% 30%, rgba(255,255,255,0.14), transparent 60%), radial-gradient(60% 50% at 80% 70%, rgba(120,180,255,0.10), transparent 60%)",
              }}
            />
            {/* Top-left: boost / online badge. We lead with boost since
                a boosted listing is always live by definition. */}
            <div className="absolute left-3 top-3 flex gap-1.5">
              {isBoosted ? (
                <Badge tone="warning" dot>
                  boost
                </Badge>
              ) : (
                <Badge tone="success" dot>
                  online
                </Badge>
              )}
            </div>
            {/* Bottom-left: game label. */}
            {listing.game && (
              <div className="absolute bottom-3 left-3 text-[11px] uppercase tracking-wider text-white/65">
                {listing.game.title}
              </div>
            )}
          </div>

          {/* Title + meta */}
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-white">
            {listing.title}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-[12px] text-white/55">
            <span className="truncate">
              {listing.seller.displayName ?? listing.seller.username}
            </span>
            <span className="text-white/25">·</span>
            <span className="num shrink-0">★ {listing.ratingAvg.toFixed(2)}</span>
            {listing.reviewCount > 0 && (
              <span className="shrink-0 text-white/35">({listing.reviewCount})</span>
            )}
          </div>

          {/* Foot: price + Buy affordance */}
          <div className="mt-auto flex items-center justify-between pt-5">
            <div className="flex items-baseline gap-2">
              <span className="num text-[18px] font-semibold text-white">
                {formatPrice(listing.price, listing.currency)}
              </span>
              {listing.compareAtPrice && (
                <span className="num text-[12px] text-white/35 line-through">
                  {formatPrice(listing.compareAtPrice, listing.currency)}
                </span>
              )}
            </div>
            <span className="rounded-full border border-white/15 px-3 py-1.5 text-[11.5px] text-white/85 transition-colors group-hover:border-white/40 group-hover:bg-white group-hover:text-black">
              Купить
            </span>
          </div>
        </GlassPanel>
      </Link>
    </Wrapper>
  );
}

// ─── Currency formatting ────────────────────────────────────────────

/**
 * Format `"18400.00" → "₽ 18 400"`.
 *
 * Intentionally manual:
 *   - Backend returns Decimal-as-string. We don't want to push it through
 *     Number(...) at the boundary because precision matters.
 *   - Intl.NumberFormat would work but the ru-RU group separator is
 *     U+00A0 in some browsers and " " in others, which makes
 *     screenshots flaky in CI. A literal thin space here is stable.
 */
function formatPrice(value: string, currency: string): string {
  const symbol = currency === "RUB" ? "₽" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "UAH" ? "₴" : currency;
  // Drop trailing ".00", keep e.g. ".50". Use an explicit split so we
  // don't take a hidden dependency on Number's float behaviour.
  const [intPart, decPart] = value.split(".");
  const intGrouped = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const showDec = decPart && decPart !== "00";
  return `${symbol} ${intGrouped}${showDec ? `,${decPart}` : ""}`;
}
