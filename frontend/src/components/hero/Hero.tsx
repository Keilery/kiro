"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Stripes } from "@/components/ui/Stripes";
import { Badge } from "@/components/ui/Badge";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { HeroPlanet } from "./HeroPlanet";
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
 *
 * Update (PR#4): the orb was replaced by HeroPlanet — a denser focal
 * shape with surface bands, atmosphere and an orbiting moon. The
 * background was deepened to true-black, so the vignette and aurora
 * intensities are tuned down here to match (otherwise the planet
 * loses contrast against the rest of the room).
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
      {/* Layer 1: deep background — true black per the darker theme. */}
      <div className="absolute inset-0 bg-ink" />
      {/*
        Layer 2: aurora gradient mesh.
        Now driven by CSS `aurora` token (already toned down ~60% in
        globals.css). The drift was previously a transform-array
        animation; we keep the same period but rely on the .aurora
        class's lower-intensity gradients so it doesn't compete with
        the planet's specular highlight.
      */}
      <motion.div
        aria-hidden
        className="absolute inset-0 aurora"
        animate={
          reduced
            ? undefined
            : { transform: ["translate3d(0,0,0) scale(1)", "translate3d(2%,-1%,0) scale(1.06)", "translate3d(0,0,0) scale(1)"] }
        }
        transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
      />
      {/* Layer 3: drifting diagonal stripes (Plan A signature, opacity 0.035 in dark theme) */}
      <Stripes drift />
      {/* Layer 4: focal planet — replaces the orb. */}
      <HeroPlanet />
      {/*
        Layer 5: vignette.
        Pulled darker (0.85 vs 0.7) and the inner clear region tightened
        from 30% → 24% so the corners go properly black. The planet sits
        in the bright pocket; everything around it falls off.
      */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, transparent 24%, rgba(0,0,0,0.85) 90%)"
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
          {/*
            Bumped from 0.55 → 0.62 against the new darker bg so the
            second line still reads at small viewports without losing
            the hierarchy contrast we want against the first line.
          */}
          <span className="text-white/[0.62]">собранная заново.</span>
        </motion.h1>

        <motion.p
          variants={item}
          className="max-w-2xl text-balance text-[17px] leading-relaxed text-white/[0.66]"
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
