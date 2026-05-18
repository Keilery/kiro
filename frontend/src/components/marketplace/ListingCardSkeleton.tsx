import { GlassPanel } from "@/components/ui/GlassPanel";

/**
 * Skeleton loader for marketplace cards.
 *
 * Matches the real card's metric grid (image aspect, title height,
 * meta row, price + button) so the layout doesn't jump when data
 * lands. The shimmer is a pure CSS gradient on a longer interval —
 * frequent enough to read as activity, slow enough to not pull focus
 * away from the rest of the page (Plan A: «фрустрация ожиданием»
 * только на низкочастотных операциях).
 */
export function ListingCardSkeleton() {
  return (
    <GlassPanel className="flex h-full flex-col p-5">
      <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-ios-sm border border-white/[0.06] bg-white/[0.025]">
        <Shimmer />
      </div>
      <SkeletonLine width="80%" height={14} className="mb-2" />
      <SkeletonLine width="55%" height={12} />
      <div className="mt-auto flex items-center justify-between pt-5">
        <SkeletonLine width="90px" height={18} />
        <SkeletonLine width="68px" height={26} rounded />
      </div>
    </GlassPanel>
  );
}

/**
 * Single shimmer block. Avoids `keyframes` definitions inline by
 * reusing the global `animate-shimmer` keyframe (already in
 * tailwind.config.ts), masked over a translucent background tint.
 */
function Shimmer() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="h-full w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
        }}
      />
    </div>
  );
}

function SkeletonLine({
  width,
  height,
  rounded,
  className,
}: {
  width: number | string;
  height: number;
  rounded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={
        "bg-white/[0.05] " +
        (rounded ? "rounded-full " : "rounded-md ") +
        (className ?? "")
      }
      style={{ width, height }}
    />
  );
}
