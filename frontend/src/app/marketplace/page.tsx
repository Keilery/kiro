import type { Metadata } from "next";
import { Stripes } from "@/components/ui/Stripes";
import { api } from "@/lib/api";
import { MarketplaceBrowser } from "@/components/marketplace/MarketplaceBrowser";
import { parseSearchParams } from "@/components/marketplace/MarketplaceBrowser";

/**
 * Marketplace browse page (server component).
 *
 * Server side we do two cheap things:
 *   1. Fetch the games catalog once. Cached for 5 min (see api.ts) so
 *      subsequent SSRs / route changes reuse the response.
 *   2. Resolve the URL search params into the canonical filter shape.
 *      Passed to the client component as `initialFilters` so the very
 *      first paint matches the URL — no flash from "no filters" to
 *      the requested view.
 *
 * The actual listings fetch is deliberately client-side: filters and
 * cursors change frequently, and SSR-hydration of an infinite-scroll
 * grid produces a worse experience than rendering skeletons-first and
 * letting the client populate. PR#15 may revisit if SSR markets
 * become a SEO priority.
 */

export const metadata: Metadata = {
  title: "Маркетплейс — NexusMarket",
  description:
    "Аккаунты, ключи, валюта, услуги, скины. Эскроу, диспуты, мгновенная авто-доставка кодов.",
};

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  // Convert the Next.js searchParams object into a URLSearchParams so
  // we can reuse the same parser the client component relies on.
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (Array.isArray(v)) {
      // Arrays come from `?type=A&type=B`. We only honour the first
      // occurrence — the schema doesn't model multi-select today.
      if (v[0]) sp.set(k, v[0]);
    } else if (v != null) {
      sp.set(k, v);
    }
  }
  const initialFilters = parseSearchParams(sp);

  // Catalog request is wrapped — if the API is down at SSR time the
  // page should still render with an empty game list (the user can
  // still browse all listings + filter by other dimensions).
  let games: Awaited<ReturnType<typeof api.catalog.games>>["games"] = [];
  try {
    const res = await api.catalog.games();
    games = res.games;
  } catch {
    games = [];
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden pt-32">
      <Stripes fine />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[480px] opacity-50"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(120,180,255,0.08), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-[1400px] px-6 pb-24">
        <header className="mb-12 max-w-3xl">
          <div className="eyebrow mb-3">Модуль 1 · 82 функции</div>
          <h1 className="display text-[clamp(40px,7vw,96px)] text-white">Маркетплейс</h1>
          <p className="mt-5 text-[16px] leading-relaxed text-white/[0.66]">
            Аккаунты, ключи, валюта, услуги, скины. Гарант-сервис, диспуты,
            мгновенная авто-доставка кодов. Эскроу — за 3 секунды.
          </p>
        </header>

        <MarketplaceBrowser games={games} initialFilters={initialFilters} />
      </div>
    </div>
  );
}
