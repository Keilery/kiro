import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  strong?: boolean;
  radius?: "sm" | "md" | "lg";
}

const radiusMap = {
  sm: "rounded-ios-sm",
  md: "rounded-ios",
  lg: "rounded-ios-lg"
};

/**
 * Liquid Glass surface — backdrop blur + tinted neutrals + 1px refraction edge.
 * Per Plan A & taste-skill section 4 (Liquid Glass refraction).
 */
export function GlassPanel({
  children,
  strong = false,
  radius = "md",
  className,
  ...rest
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        radiusMap[radius],
        "overflow-hidden",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
