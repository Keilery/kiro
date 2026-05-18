"use client";

import Link from "next/link";
import { ShieldCheck, Star, Calendar } from "lucide-react";
import type { ListingSellerSummary } from "@/lib/types";

/**
 * Compact seller card shown on listing detail pages.
 *
 * Two responsibilities:
 *   - Trust signals: tier badge (PLATINUM/GOLD/...), join date, level.
 *   - Navigation: clicking the seller header takes the user to the
 *     seller's storefront (`/users/[username]`, landing in PR#13).
 *     Until that page exists the link still resolves — it just
 *     renders the existing PageShell stub.
 *
 * Avatars: when the seller hasn't uploaded one we render their
 * monogram on a tinted background. Falling back to a generic Lucide
 * <User /> would make every seller look interchangeable.
 */
export function SellerCard({ seller }: { seller: ListingSellerSummary }) {
  const initial = (seller.displayName ?? seller.username).slice(0, 1).toUpperCase();

  return (
    <div className="rounded-ios border border-white/[0.08] bg-white/[0.02] p-5">
      <Link
        href={`/users/${encodeURIComponent(seller.username)}`}
        className="group flex items-center gap-3"
      >
        {seller.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={seller.avatarUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full border border-white/[0.10] object-cover"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        ) : (
          <Avatar initial={initial} />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[14.5px] font-medium text-white group-hover:underline">
              {seller.displayName ?? seller.username}
            </span>
            <TierBadge tier={seller.sellerTier} />
          </div>
          <div className="text-[12px] text-white/55">@{seller.username}</div>
        </div>
      </Link>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
        {seller.level != null && (
          <Stat icon={<Star className="h-3.5 w-3.5" strokeWidth={1.6} />} label="Уровень" value={`${seller.level}`} />
        )}
        {seller.createdAt && (
          <Stat
            icon={<Calendar className="h-3.5 w-3.5" strokeWidth={1.6} />}
            label="С нами"
            value={formatJoinedYear(seller.createdAt)}
          />
        )}
      </dl>

      {/* CTA: write to seller. Until chat lands in PR#11 this anchors
          to the seller storefront where they can publish a contact
          mailto. We don't render a fake message-form to avoid the
          worst kind of feedback (silently swallowed messages). */}
      <Link
        href={`/users/${encodeURIComponent(seller.username)}#contact`}
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.025] text-[13px] text-white/85 transition-colors hover:border-white/30 hover:bg-white/[0.05]"
      >
        Написать продавцу
      </Link>
    </div>
  );
}

function Avatar({ initial }: { initial: string }) {
  // Background tint is content-derived but stable: a hash of the
  // initial picks one of a small palette so the same letter always
  // looks the same. Pure-decorative — no PII implications.
  const palette = [
    "from-blue-500/30 to-cyan-500/20",
    "from-emerald-500/30 to-lime-500/20",
    "from-amber-500/30 to-rose-500/20",
    "from-violet-500/30 to-fuchsia-500/20",
  ];
  const idx = (initial.charCodeAt(0) ?? 0) % palette.length;
  return (
    <div
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/[0.10] bg-gradient-to-br ${palette[idx]} text-[16px] font-semibold text-white`}
    >
      {initial}
    </div>
  );
}

function TierBadge({ tier }: { tier: ListingSellerSummary["sellerTier"] }) {
  if (tier === "NONE") return null;
  // Each tier maps to a distinct visual treatment so a quick glance
  // tells the buyer "this seller passed verification".
  const className =
    tier === "PLATINUM"
      ? "border-white/30 bg-white/15 text-white"
      : tier === "GOLD"
        ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
        : tier === "SILVER"
          ? "border-zinc-300/25 bg-zinc-300/10 text-zinc-200"
          : "border-orange-400/25 bg-orange-400/10 text-orange-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${className}`}
    >
      <ShieldCheck className="h-3 w-3" strokeWidth={2} />
      {tier.toLowerCase()}
    </span>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-1.5 text-white/55">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-[14px] text-white">{value}</div>
    </div>
  );
}

/**
 * "С нами с 2024" — year-only is more informative than a full date
 * for the trust-signal context. Defensively swallows parse errors so
 * a bad timestamp from the API doesn't break the card.
 */
function formatJoinedYear(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return `${d.getUTCFullYear()}`;
  } catch {
    return "—";
  }
}
