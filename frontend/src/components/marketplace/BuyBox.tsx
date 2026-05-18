"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, Truck, Clock } from "lucide-react";
import { useIsAuthenticated } from "@/lib/auth-store";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { ListingDetail } from "@/lib/types";

/**
 * Buy box for the listing detail page.
 *
 * Sits in the right column on lg+; collapses below the gallery on
 * smaller viewports. Sticky so the user can keep the price/CTA in
 * view while reading the description and reviews.
 *
 * For PR#4 the actual checkout call is deferred — the button takes
 * the user to /orders/new?listingId=… (or to login first if they're
 * a guest). The full checkout flow lands in PR#5 (shop) along with
 * promo codes and the multi-item cart. For now this component just
 * has to show the right price, stock, delivery hint and CTA copy.
 */
export function BuyBox({ listing }: { listing: ListingDetail }) {
  const isAuthed = useIsAuthenticated();
  const [qty, setQty] = useState(1);

  // Stock helpers. `unlimited` overrides everything — the seller has
  // procedurally-issued codes, we never block on inventory.
  const stockKnown = !listing.unlimited;
  const inStock = listing.unlimited || listing.stockQty > 0;
  // Cap qty to whatever stock allows, with a sensible upper bound for
  // unlimited items so a typo can't request 10_000 codes by accident.
  const maxQty = listing.unlimited ? 50 : Math.min(50, listing.stockQty);
  const safeQty = Math.max(1, Math.min(qty, maxQty || 1));

  const totalString = computeTotal(listing.price, safeQty);

  const checkoutHref = isAuthed
    ? `/orders/new?listingId=${encodeURIComponent(listing.id)}&qty=${safeQty}`
    : `/auth/login?return=${encodeURIComponent(`/marketplace/${listing.slug}`)}`;

  return (
    <div className="lg:sticky lg:top-28">
      <GlassPanel strong className="p-5">
        {/* Price block */}
        <div className="flex items-baseline gap-3">
          <span className="num text-[34px] font-semibold leading-none text-white">
            {formatPrice(listing.price, listing.currency)}
          </span>
          {listing.compareAtPrice && (
            <span className="num text-[14px] text-white/35 line-through">
              {formatPrice(listing.compareAtPrice, listing.currency)}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[12px] text-white/55">
          <span>за {safeQty === 1 ? "1 шт" : `${safeQty} шт`}</span>
          <span className="text-white/25">·</span>
          <span>
            всего: <span className="num text-white/85">{formatPrice(totalString, listing.currency)}</span>
          </span>
        </div>

        {/* Stock + qty selector. We hide the input entirely if there's
            only one unit available; a "1 / 1" stepper would just be
            visual noise. */}
        <div className="mt-5 flex items-center justify-between gap-3 rounded-md border border-white/[0.06] bg-white/[0.025] p-2.5">
          <div className="flex items-center gap-2 text-[12.5px] text-white/[0.78]">
            <Truck className="h-3.5 w-3.5" strokeWidth={1.6} />
            {deliveryLabel(listing.deliveryMode)}
          </div>
          {(maxQty > 1 || listing.unlimited) && (
            <QtyStepper value={safeQty} onChange={setQty} max={maxQty} />
          )}
        </div>

        {/* CTA */}
        <motion.a
          href={inStock ? checkoutHref : undefined}
          aria-disabled={!inStock}
          whileTap={inStock ? { scale: 0.97 } : undefined}
          className={
            "mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14px] font-medium transition-colors " +
            (inStock
              ? "bg-white text-black hover:bg-white/90"
              : "cursor-not-allowed border border-white/[0.10] bg-white/[0.04] text-white/45")
          }
        >
          {inStock ? (
            <>
              <Zap className="h-4 w-4" strokeWidth={2} />
              {listing.deliveryMode === "AUTO" ? "Купить — мгновенная доставка" : "Купить сейчас"}
            </>
          ) : (
            "Нет в наличии"
          )}
        </motion.a>

        {/* Trust strip — short, scannable, no marketing fluff. */}
        <ul className="mt-5 space-y-2.5 text-[12.5px] text-white/[0.72]">
          <Trust icon={<ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.6} />}>
            Эскроу: средства замораживаются до подтверждения покупателем.
          </Trust>
          <Trust icon={<Clock className="h-3.5 w-3.5" strokeWidth={1.6} />}>
            48 часов на проверку. После — авто-зачисление продавцу.
          </Trust>
          {stockKnown && (
            <Trust icon={<Truck className="h-3.5 w-3.5" strokeWidth={1.6} />}>
              В наличии: <span className="num text-white/85">{listing.stockQty}</span> шт.
            </Trust>
          )}
        </ul>
      </GlassPanel>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function QtyStepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/[0.10] bg-white/[0.025] px-1 py-0.5">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className="grid h-7 w-7 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/[0.06] disabled:opacity-40"
        aria-label="Уменьшить"
      >
        −
      </button>
      <span className="num min-w-[1.5em] text-center text-[12.5px] text-white">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="grid h-7 w-7 place-items-center rounded-full text-white/85 transition-colors hover:bg-white/[0.06] disabled:opacity-40"
        aria-label="Увеличить"
      >
        +
      </button>
    </div>
  );
}

function Trust({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-white/55">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────
// Shared with ListingCard but kept inline because Buy needs the larger
// font sizes and the comma-separator behaviour identical.

function deliveryLabel(mode: ListingDetail["deliveryMode"]): string {
  switch (mode) {
    case "AUTO":
      return "Мгновенная авто-доставка";
    case "SCHEDULED":
      return "Доставка по расписанию";
    case "MANUAL":
    default:
      return "Доставка вручную продавцом";
  }
}

function formatPrice(value: string, currency: string): string {
  const symbol = currency === "RUB" ? "₽" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "UAH" ? "₴" : currency;
  const [intPart, decPart] = value.split(".");
  const intGrouped = intPart!.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const showDec = decPart && decPart !== "00";
  return `${symbol} ${intGrouped}${showDec ? `,${decPart}` : ""}`;
}

/**
 * Multiplies a Decimal-as-string by an integer quantity without ever
 * routing through Number, so we can't drop precision on values like
 * 142_700.99 × 3.
 */
function computeTotal(price: string, qty: number): string {
  const [intPart = "0", decPart = ""] = price.split(".");
  // Treat the price as integer cents at 2dp.
  const cents = BigInt(intPart) * 100n + BigInt((decPart + "00").slice(0, 2));
  const total = cents * BigInt(qty);
  const intStr = (total / 100n).toString();
  const decStr = (total % 100n).toString().padStart(2, "0");
  return `${intStr}.${decStr}`;
}
