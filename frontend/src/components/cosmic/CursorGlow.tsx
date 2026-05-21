"use client";

import { useEffect, useRef } from "react";

/**
 * CursorGlow — мягкое свечение под курсором. Lerp-ed позиция через RAF.
 * Никаких re-render'ов React. Скрывается на тачскринах.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(hover: none)").matches) {
      el.style.display = "none";
      return;
    }

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let x = mx;
    let y = my;
    let raf = 0;

    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const loop = () => {
      x += (mx - x) * 0.08;
      y += (my - y) * 0.08;
      el.style.transform = `translate3d(${x - 220}px, ${y - 220}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", move);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[1] h-[440px] w-[440px] rounded-full"
      style={{
        background:
          "radial-gradient(circle at center, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 35%, transparent 70%)",
        filter: "blur(20px)",
        willChange: "transform"
      }}
    />
  );
}
