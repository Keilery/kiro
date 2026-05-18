import { Stripes } from "@/components/ui/Stripes";
import type { ReactNode } from "react";

export function PageShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden pt-32">
      <Stripes fine />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[480px] opacity-50"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(120,180,255,0.10), transparent 70%)"
        }}
      />
      <div className="relative mx-auto max-w-[1400px] px-6">
        <div className="eyebrow mb-3">{eyebrow}</div>
        <h1 className="display text-[clamp(40px,7vw,96px)] text-white">{title}</h1>
        {description && (
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-white/60">
            {description}
          </p>
        )}
        <div className="mt-16">{children}</div>
      </div>
    </div>
  );
}
