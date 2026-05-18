import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { Stripes } from "@/components/ui/Stripes";
import { Badge } from "@/components/ui/Badge";
import { ListingGallery } from "@/components/marketplace/ListingGallery";
import { SellerCard } from "@/components/marketplace/SellerCard";
import { BuyBox } from "@/components/marketplace/BuyBox";
import { ListingReviews } from "@/components/marketplace/ListingReviews";
import { RelatedListings } from "@/components/marketplace/RelatedListings";

/**
 * Listing detail page.
 *
 * Server component. We fetch the listing + related rail in parallel
 * — both feed the initial HTML, so search engines and unfurlers see
 * the actual content. Reviews load client-side because the user
 * reaches them only by scrolling, and lazy-loading saves bandwidth
 * for the (frequent) bounce-back-to-grid flow.
 *
 * Visibility:
 *   - 404 from the API → notFound() so Next.js renders the global 404
 *     page rather than a half-broken layout.
 *   - Hidden listings (DRAFT/REJECTED/ARCHIVED for non-owners) come
 *     back as 404 from the API on purpose — we don't leak existence.
 *   - Anything else (network, 5xx) bubbles to the error boundary so
 *     we get a real error page rather than a silent empty state.
 */

interface Props {
  // Next 14: params is a plain object. Stays sync (no Promise) until
  // we adopt the async-params change in PR#15.
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { listing } = await api.listings.get(params.slug);
    return {
      title: `${listing.title} — NexusMarket`,
      description:
        // Listings don't expose dedicated SEO copy yet (lands with PR#14
        // when we add the SEO panel to the seller editor). For now we
        // synthesize from the description, capped to a reasonable length.
        listing.description?.slice(0, 160) ??
        `${listing.title} от ${listing.seller.displayName ?? listing.seller.username}.`,
      openGraph: {
        title: listing.title,
        description: listing.description ?? undefined,
        images: listing.images.find((i) => i.isCover)?.url ?? listing.images[0]?.url,
      },
    };
  } catch {
    // Fall back silently — the page itself will redirect to 404 below.
    return { title: "Листинг — NexusMarket" };
  }
}

export default async function ListingDetailPage({ params }: Props) {
  // Catch 404 separately so we can call notFound(); other API errors
  // (5xx, network) propagate to the route's error boundary.
  let listing;
  try {
    const res = await api.listings.get(params.slug);
    listing = res.listing;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  // Related is best-effort — failing the rail shouldn't fail the page.
  let related: Awaited<ReturnType<typeof api.listings.related>>["listings"] = [];
  try {
    const res = await api.listings.related(params.slug);
    related = res.listings;
  } catch {
    related = [];
  }

  const isBoosted =
    !!listing.boostedUntil && new Date(listing.boostedUntil) > new Date();

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
        {/* Breadcrumbs. Plain links, not a fancy breadcrumb component
            — the path is short and JS-free navigation is fine here. */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-[12.5px] text-white/55">
          <Link href="/marketplace" className="hover:text-white">
            Маркетплейс
          </Link>
          {listing.game && (
            <>
              <span className="text-white/25">/</span>
              <Link
                href={`/marketplace?gameSlug=${encodeURIComponent(listing.game.slug)}`}
                className="hover:text-white"
              >
                {listing.game.title}
              </Link>
            </>
          )}
          <span className="text-white/25">/</span>
          <span className="line-clamp-1 text-white/85">{listing.title}</span>
        </nav>

        {/* Title row — left-aligned to match the rest of the marketing
            site, not centered like the hero. */}
        <header className="mb-8 max-w-3xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={isBoosted ? "warning" : "success"} dot={!isBoosted}>
              {isBoosted ? "boost" : "online"}
            </Badge>
            {listing.game && (
              <Badge tone="neutral">{listing.game.title}</Badge>
            )}
            {listing.platform && <Badge tone="neutral">{listing.platform}</Badge>}
          </div>
          <h1 className="display text-[clamp(28px,4vw,48px)] text-white">
            {listing.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-[13px] text-white/60">
            <span className="num">★ {listing.ratingAvg.toFixed(2)}</span>
            <span className="text-white/25">·</span>
            <span>{listing.reviewCount} отзывов</span>
            <span className="text-white/25">·</span>
            <span>{listing.salesCount} продаж</span>
          </div>
        </header>

        {/* Main two-column layout. Gallery + details on the left, buy
            box + seller on the right. Stacks at md and below. */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-8 min-w-0">
            <ListingGallery images={listing.images} />

            {/* Description. The backend allows ~8KB of plain text;
                we render it preserving line breaks but not arbitrary
                HTML — sanitization rules out rendering markdown
                blindly until PR#14 wires DOMPurify. */}
            {listing.description && (
              <section className="rounded-ios border border-white/[0.07] bg-white/[0.02] p-6">
                <div className="eyebrow mb-3">Описание</div>
                <div className="whitespace-pre-line text-[14px] leading-relaxed text-white/[0.82]">
                  {listing.description}
                </div>
                {listing.tags.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {listing.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/[0.09] bg-white/[0.025] px-2.5 py-1 text-[11.5px] text-white/70"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </section>
            )}

            <ListingReviews
              listingId={listing.id}
              initialAvg={listing.ratingAvg}
              initialCount={listing.reviewCount}
            />
          </div>

          <div className="space-y-5 min-w-0">
            <BuyBox listing={listing} />
            <SellerCard seller={listing.seller} />
          </div>
        </div>

        {/* Related rail goes below both columns at full width. */}
        {related.length > 0 && (
          <div className="mt-16">
            <RelatedListings items={related} />
          </div>
        )}
      </div>
    </div>
  );
}
