"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import type { ListingImage } from "@/lib/types";

/**
 * Image gallery for the listing detail page.
 *
 * Behaviour:
 *   - Hero image at the top, thumbnail strip beneath (or to the right
 *     on lg+). Clicking a thumb swaps the hero, with a soft cross-fade
 *     animation handled by AnimatePresence.
 *   - Keyboard: ←/→ on focused thumbs cycles between images.
 *   - Empty state: when no images are present we render the same
 *     gradient placeholder used by ListingCard so the layout doesn't
 *     visibly depend on the cdn coming up first.
 *
 * No lightbox/zoom in v1. The detail page is dense enough; a modal
 * overlay would compete with the buy box. Plan A §1 #17 (zoom) lands
 * with the official-shop work in PR#5.
 */
export function ListingGallery({ images }: { images: ListingImage[] }) {
  // Sort by `position` then float covers up. Preserves seller intent
  // (they explicitly set isCover) without forcing them to also drag
  // the cover to position 0.
  const ordered = [...images].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return a.position - b.position;
  });

  const [activeId, setActiveId] = useState<string | null>(ordered[0]?.id ?? null);
  const active = ordered.find((i) => i.id === activeId) ?? ordered[0];

  function moveBy(delta: number) {
    if (ordered.length < 2 || !active) return;
    const i = ordered.findIndex((img) => img.id === active.id);
    const next = (i + delta + ordered.length) % ordered.length;
    setActiveId(ordered[next]!.id);
  }

  if (ordered.length === 0) {
    return <PlaceholderHero />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Hero — fixed aspect so the page doesn't reflow when switching images. */}
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-ios border border-white/[0.07] bg-white/[0.02]"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") moveBy(1);
          if (e.key === "ArrowLeft") moveBy(-1);
        }}
        tabIndex={0}
        role="region"
        aria-label="Галерея изображений товара"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={active!.id}
            src={active!.url}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
          />
        </AnimatePresence>
        {/* Always-rendered placeholder under the img so a 404 still
            shows the same texture as the empty state. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(70% 60% at 30% 30%, rgba(255,255,255,0.14), transparent 60%), radial-gradient(60% 50% at 80% 70%, rgba(120,180,255,0.10), transparent 60%)",
          }}
        />
      </div>

      {/* Thumb strip. Only render when there are at least 2 images —
          a single thumb under the hero is just visual noise. */}
      {ordered.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {ordered.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiveId(img.id)}
              className={cn(
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-md border transition-colors",
                img.id === active!.id
                  ? "border-white"
                  : "border-white/[0.09] hover:border-white/30",
              )}
              aria-label="Показать это изображение"
              aria-current={img.id === active!.id}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlaceholderHero() {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-ios border border-white/[0.07] bg-white/[0.02]">
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(70% 60% at 30% 30%, rgba(255,255,255,0.16), transparent 60%), radial-gradient(60% 50% at 80% 70%, rgba(120,180,255,0.12), transparent 60%)",
        }}
      />
      <div className="absolute inset-0 grid place-items-center text-[12.5px] text-white/35">
        Изображения скоро появятся
      </div>
    </div>
  );
}
