"use client";

import { motion } from "framer-motion";

/**
 * The "liquid glass" orb at the focal point of the hero.
 * Three concentric rotating rings + a soft refractive core.
 * GPU-only animations (transform/opacity), per taste-skill §5.
 */
export function HeroOrb() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] -translate-x-1/2 -translate-y-1/2"
      style={{ filter: "blur(0.4px)" }}
    >
      {/* core */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-[28%] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.45), rgba(255,255,255,0.05) 55%, transparent 70%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -40px 80px rgba(255,255,255,0.05), 0 0 80px rgba(255,255,255,0.06)"
        }}
      />
      {/* ring 1 */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 36, ease: "linear", repeat: Infinity }}
        className="absolute inset-[10%] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.12) 90deg, transparent 180deg, rgba(255,255,255,0.08) 270deg, transparent 360deg)",
          mask: "radial-gradient(closest-side, transparent 78%, black 79%, black 80%, transparent 81%)"
        }}
      />
      {/* ring 2 — counter rotate */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 56, ease: "linear", repeat: Infinity }}
        className="absolute inset-[2%] rounded-full"
        style={{
          background:
            "conic-gradient(from 90deg, transparent 0deg, rgba(48,209,88,0.18) 60deg, transparent 120deg, rgba(255,159,10,0.12) 220deg, transparent 280deg)",
          mask: "radial-gradient(closest-side, transparent 92%, black 93%, black 94%, transparent 95%)"
        }}
      />
      {/* ring 3 — outer thin */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 80, ease: "linear", repeat: Infinity }}
        className="absolute -inset-[5%] rounded-full"
        style={{
          background:
            "conic-gradient(from 180deg, transparent, rgba(255,255,255,0.08), transparent)",
          mask: "radial-gradient(closest-side, transparent 96%, black 97%, black 98%, transparent 99%)"
        }}
      />
    </div>
  );
}
