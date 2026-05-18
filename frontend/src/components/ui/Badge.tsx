import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "error";

const toneMap: Record<Tone, string> = {
  neutral: "border-white/15 text-white/85 bg-white/5",
  success: "border-emerald-400/30 text-emerald-300 bg-emerald-400/10",
  warning: "border-amber-400/30 text-amber-300 bg-amber-400/10",
  error: "border-rose-400/30 text-rose-300 bg-rose-400/10"
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider",
        toneMap[tone],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full animate-pulse-dot",
            tone === "success" && "bg-emerald-400",
            tone === "warning" && "bg-amber-400",
            tone === "error" && "bg-rose-400",
            tone === "neutral" && "bg-white/70"
          )}
        />
      )}
      {children}
    </span>
  );
}
