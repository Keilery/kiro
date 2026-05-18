import { ListingCard } from "./ListingCard";
import type { ListingCard as ListingCardType } from "@/lib/types";

/**
 * Related-listings rail under the listing detail.
 *
 * Server-fetched on the parent page (so it shows up in initial HTML
 * for SEO + LCP) but we keep the component server-renderable: no
 * "use client", just a plain layout component over data passed in.
 *
 * If the API returned nothing (rare but possible — niche game with a
 * single seller), the section hides itself rather than rendering an
 * empty rail. Keeping a "Похожих не нашли" line would be noise.
 */
export function RelatedListings({ items }: { items: ListingCardType[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="eyebrow mb-1.5">Похожие товары</div>
          <h2 className="display text-[clamp(22px,3vw,32px)] text-white">
            Тоже стоит посмотреть
          </h2>
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.slice(0, 6).map((listing, i) => (
          // We disable the entrance animation here on purpose: the
          // user already saw motion on the cards above, and viewers
          // who land directly on a listing detail expect the related
          // rail to be visible immediately, not staggered in.
          <ListingCard key={listing.id} listing={listing} index={i} withMotion={false} />
        ))}
      </div>
    </section>
  );
}
