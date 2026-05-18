import { cn } from "@/lib/cn";

/**
 * Diagonal stripe overlay per Plan A design system.
 * 3px white lines @ opacity 0.05, 45deg, repeating.
 * Used as a global texture layer behind hero and section backgrounds.
 */
export function Stripes({
  className,
  fine = false,
  drift = false
}: {
  className?: string;
  fine?: boolean;
  drift?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        fine ? "stripes-fine" : "stripes",
        drift && "animate-stripes-drift",
        className
      )}
    />
  );
}
