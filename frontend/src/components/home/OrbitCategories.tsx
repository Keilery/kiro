"use client";

import { GravityScroll } from "@/components/cosmic/GravityScroll";
import { OrbitNav } from "@/components/cosmic/OrbitNav";

export function OrbitCategories() {
  return (
    <section className="relative py-32 lg:py-40">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <GravityScroll className="mb-20 text-center lg:mb-28">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
            // 01 · орбитальная навигация
          </div>
          <h2 className="mt-5 headline-hero text-[clamp(36px,5vw,76px)] text-space-white">
            Выбери траекторию
          </h2>
          <p className="mx-auto mt-5 max-w-[540px] text-[15px] leading-relaxed text-space-lunar/70">
            Категории расположены по орбитам вокруг центральной звезды. Каждая —
            отдельная вселенная сделок.
          </p>
        </GravityScroll>

        <OrbitNav />
      </div>

      {/* нижний декоративный градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
    </section>
  );
}
