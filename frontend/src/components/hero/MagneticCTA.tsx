"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Magnetic CTA per taste-skill §4 — uses useMotionValue/useTransform
 * outside the React render cycle (no useState for hover physics).
 * Spring config: production-grade (stiffness 220, damping 22).
 */
export function MagneticCTA({
  children,
  href,
  variant = "primary",
  className
}: {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const spring = { stiffness: 220, damping: 22, mass: 0.6 };
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  // inner content drifts further than the shell — adds depth
  const ix = useTransform(sx, (v) => v * 1.6);
  const iy = useTransform(sy, (v) => v * 1.6);

  function handleMouse(e: React.MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    // limit pull radius
    x.set(Math.max(-12, Math.min(12, dx * 0.25)));
    y.set(Math.max(-8, Math.min(8, dy * 0.25)));
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  const base =
    variant === "primary"
      ? "bg-white text-black"
      : "bg-white/5 text-white border border-white/15";

  return (
    <motion.a
      ref={ref}
      href={href ?? "#"}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x: sx, y: sy }}
      className={cn(
        "group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full px-7 text-[15px] font-medium",
        "shadow-glass-edge will-change-transform",
        base,
        className
      )}
    >
      {/* shimmer sweep on hover */}
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-1000 ease-out-expo group-hover:translate-x-full" />
      <motion.span style={{ x: ix, y: iy }} className="relative inline-flex items-center gap-2">
        {children}
      </motion.span>
    </motion.a>
  );
}
