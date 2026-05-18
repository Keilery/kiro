"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";

/**
 * HeroPlanet — the animated focal object on the home screen.
 *
 * Why this replaced HeroOrb
 * -------------------------
 * The orb (3 thin counter-rotating rings around an empty core) read as
 * decorative on the brighter previous theme. With the bg deepened to
 * true-black we needed a denser focal shape — one with a clear
 * surface, atmosphere, and a light source — so the eye lands on it
 * before the headline. A planet does that, a ring does not.
 *
 * Construction
 * ------------
 * 1. **Atmosphere ring** — a slightly-larger blurred radial gradient.
 *    This is the cheapest "rim light" trick available; we lift the
 *    color toward the lit side via a second offset gradient.
 * 2. **Surface bands** — a conic gradient masked to a sphere. Spinning
 *    the conic at a steady angular rate gives the read of a rotating
 *    body without needing a real 3D texture.
 * 3. **Cloud bands** — a second masked layer with different colors
 *    and a *different* rotation period. The asynchrony breaks the
 *    moiré that would otherwise appear if both layers stepped together.
 * 4. **Terminator** — a fixed linear gradient on top of everything.
 *    Doesn't rotate; it's a directional shadow tied to the (notional)
 *    sun position. Stable terminator + rotating surface = "the planet
 *    is spinning, the sun isn't".
 * 5. **Specular highlight** — a small bright radial gradient at ~25%/30%.
 *    Pure decoration; ties the lit hemisphere together visually.
 * 6. **Orbiting moon** — child of a wrapper that rotates 360deg over
 *    a long period; the moon itself is offset to one side, so the
 *    parent's rotation traces a circle without per-frame trig.
 * 7. **Parallax tilt** — the whole assembly rotates slightly on the
 *    Y/X axis tracking the mouse, via useMotionValue + spring (per the
 *    taste-skill rule: physics outside the React render cycle).
 *
 * Performance & accessibility
 * ---------------------------
 * - GPU-only: every animation uses `transform` or `opacity`, never
 *   layout properties. CSS `animation` drives the steady spins so
 *   we don't burn React renders on idle motion.
 * - `prefers-reduced-motion` short-circuits all of it: parallax goes
 *   inert, CSS spins are stopped via a class toggle, the planet stays
 *   visible as a static composition.
 * - One root element passes `pointer-events: none` so the planet can't
 *   block focusable elements behind it.
 */
export function HeroPlanet() {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse-driven tilt. Stored as motion values + sprung — the React
  // tree never re-renders on mouse move (taste-skill §4: continuous
  // animations stay outside the render cycle).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springCfg = { stiffness: 80, damping: 18, mass: 0.8 };
  const sx = useSpring(mx, springCfg);
  const sy = useSpring(my, springCfg);

  // Tilt is small on purpose — too much rotation flips the terminator
  // and breaks the lighting illusion. ±6deg is the comfort band.
  const rotateY = useTransform(sx, [-1, 1], [-6, 6]);
  const rotateX = useTransform(sy, [-1, 1], [4, -4]);

  // Inner shell drifts slightly more than the outer atmosphere — that
  // 1.6× ratio is enough to read as parallax depth without revealing
  // the trick.
  const innerRotateY = useTransform(sx, [-1, 1], [-9.6, 9.6]);
  const innerRotateX = useTransform(sy, [-1, 1], [6.4, -6.4]);

  useEffect(() => {
    if (reduced) return;

    // Mouse listener attaches to window so the user gets parallax
    // even when the cursor is over headline text. We normalize to
    // viewport center and clamp to [-1, 1].
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mx.set(Math.max(-1, Math.min(1, (e.clientX - cx) / cx)));
      my.set(Math.max(-1, Math.min(1, (e.clientY - cy) / cy)));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my, reduced]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="planet-stage pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      {/* Outer atmosphere — a soft halo larger than the planet. Sits
          behind everything else and barely moves. */}
      <motion.div
        style={{ rotateY, rotateX }}
        className="planet-atmosphere"
      />

      {/* Planet shell — surface + clouds + terminator + specular.
          Tilts a bit more than the atmosphere to sell depth. */}
      <motion.div
        style={{ rotateY: innerRotateY, rotateX: innerRotateX }}
        className={`planet-shell ${reduced ? "planet-static" : ""}`}
      >
        {/* Surface bands: conic gradient, slow rotation. */}
        <div className="planet-surface" />
        {/* Cloud layer: faster, opposite direction, subtle opacity. */}
        <div className="planet-clouds" />
        {/* Terminator: directional shadow, does NOT spin (sun is fixed). */}
        <div className="planet-terminator" />
        {/* Specular highlight on the lit hemisphere. */}
        <div className="planet-specular" />
      </motion.div>

      {/* Moon system — wrapper rotates, moon is offset within. The
          orbit ellipse is faked by squashing the wrapper on Y. */}
      <div className={`planet-orbit ${reduced ? "planet-static" : ""}`}>
        <div className="planet-moon" />
      </div>

      {/* Tiny background stars — pure decoration, fades in last so it
          doesn't dominate during the hero entrance. */}
      <div className="planet-stars" />
    </div>
  );
}
