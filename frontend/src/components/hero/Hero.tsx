"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Stripes } from "@/components/ui/Stripes";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { HeroOrb } from "./HeroOrb";
import { MagneticCTA } from "./MagneticCTA";
import { ArrowUpRight, Sparkles, Zap } from "lucide-react";

/**
 * Hero — the home screen with motion design (per user requirement).
 *
 * Applied principles:
 *  - design-motion-principles: spring physics, frequency gate (rare → expressive),
 *    prefers-reduced-motion handled, no layout-property animation
 *  - taste-skill: MOTION_INTENSITY 8 — staggered orchestration, perpetual
 *    micro-animations, magnetic CTA outside React render cycle, GPU-only
 *  - impeccable: ease-out-expo curves, no gradient text, hierarchy via weight+scale
 *  - frontend-design: bold direction, atmospheric layers, distinctive typography
 *  - Plan A: black background + 45deg stripes opacity 0.05 + Liquid Glass + 22px radii
 */

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 }
  }
};

const item = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 100, damping: 20, mass: 0.7 }
  }
};

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative isolate flex min-h-[100dvh] w-full items-center overflow-hidden">
      {/* Layer 1: deep background */}
      <div className="absolute inset-0 bg-ink-950" />
      {/* Layer 2: aurora gradient mesh */}
      <motion.div
        aria-hidden
        className="absolute inset-0 aurora"
        animate={
          reduced
            ? undefined
            : { transform: ["translate3d(0,0,0) scale(1)", "translate3d(2%,-1%,0) scale(1.08)", "translate3d(0,0,0) scale(1)"] }
        }
        transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
      />
      {/* Layer 3: drifting diagonal stripes (Plan A signature) */}
      <Stripes drift />
      {/* Layer 4: focal orb */}
      <HeroOrb />
      {/* Layer 5: vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,0.7) 90%)"
        }}
      />

      {/* Content — staggered orchestration */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 py-32 text-center"
      >
        <motion.div variants={item}>
          <Badge tone="success" dot>
            Live · 2 481 продавцов онлайн
          </Badge>
        </motion.div>

        <motion.h1
          variants={item}
          className="display max-w-5xl text-[clamp(48px,9vw,128px)] text-white"
        >
          Игровая экономика,
          <br />
          <span className="text-white/55">собранная заново.</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="max-w-2xl text-balance text-[17px] leading-relaxed text-white/60"
        >
          Маркетплейс, аренда, автодоставка и боты для FunPay, Starvell и Playerok —
          в одной платформе. Эскроу, мгновенные ключи, 552 функции под капотом.
        </motion.p>

        <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3">
          <MagneticCTA href="/marketplace">
            Открыть маркет
            <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
          </MagneticCTA>
          <MagneticCTA href="/automation" variant="ghost">
            <Sparkles className="h-4 w-4" strokeWidth={1.6} />
            Автоматизация
          </MagneticCTA>
        </motion.div>

        {/* Floating live-stats glass card — perpetual micro-interaction */}
        <motion.div variants={item} className="w-full max-w-3xl pt-6">
          <GlassPanel strong className="grid grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
            <Stat label="Сделок / 24ч" value="14 287" trend="+12.4%" />
            <Stat label="GMV месяц" value="₽ 47.2M" trend="+8.1%" />
            <Stat label="Avg ETA" value="3.2 сек" trend="−0.4с" tone="success" />
            <Stat label="Дисп. resolved" value="98.6%" trend="+0.3%" tone="success" />
          </GlassPanel>
        </motion.div>
      </motion.div>

      {/* perpetual indicator at bottom */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="eyebrow">scroll</span>
          <motion.div
            animate={reduced ? undefined : { y: [0, 8, 0], opacity: [1, 0.4, 1] }}
            transition={{ duration: 2.2, ease: "easeInOut", repeat: Infinity }}
            className="h-8 w-[1px] bg-white/30"
          />
        </div>
      </motion.div>

      {/* radial flares — Zap icon as silent decorator */}
      <Zap className="absolute right-8 top-8 h-4 w-4 text-white/20" strokeWidth={1.5} />
    </section>
  );
}

function Stat({
  label,
  value,
  trend,
  tone = "neutral"
}: {
  label: string;
  value: string;
  trend?: string;
  tone?: "neutral" | "success";
}) {
  return (
    <div className="px-5 py-5 text-left">
      <div className="eyebrow mb-2">{label}</div>
      <div className="num text-2xl font-semibold tracking-tight text-white">
        {value}
      </div>
      {trend && (
        <div
          className={
            "mt-1 text-xs " +
            (tone === "success" ? "text-emerald-300" : "text-white/45")
          }
        >
          {trend}
        </div>
      )}
    </div>
  );
}
