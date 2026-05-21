"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { GravityScroll } from "@/components/cosmic/GravityScroll";
import { games } from "@/lib/mock-data";
import { formatNumber, formatPct } from "@/lib/format";

export function PopularGames() {
  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <GravityScroll className="mb-12 flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
              // 02 · популярные системы
            </div>
            <h2 className="mt-5 headline-hero text-[clamp(32px,4.4vw,64px)] text-space-white">
              Игры — звёзды каталога
            </h2>
          </div>
          <Link
            href="/catalog"
            className="hidden items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-space-lunar transition-colors hover:text-space-white md:inline-flex"
          >
            Все игры
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </GravityScroll>

        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
          {games.map((g, i) => (
            <motion.div
              key={g.slug}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.05 * (i % 8), duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/catalog?game=${g.slug}`}
                className="group relative block aspect-[16/11] overflow-hidden rounded-orbit border border-white/[0.07] bg-space-deep/60 transition-all duration-500 ease-warp hover:-translate-y-1 hover:border-white/25 hover:shadow-halo-white"
              >
                {/* Декоративный фон — концентрические круги */}
                <div className="absolute inset-0 cosmic-grid-fine opacity-40" />
                <div
                  aria-hidden
                  className="absolute -bottom-16 -right-16 h-44 w-44 rounded-full border border-white/5"
                />
                <div
                  aria-hidden
                  className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full border border-white/[0.08]"
                />
                <div
                  aria-hidden
                  className="absolute -bottom-4 -right-4 h-14 w-14 rounded-full bg-white/[0.04]"
                />
                {/* Текст */}
                <div className="relative flex h-full flex-col justify-between p-4">
                  <div className="flex items-start justify-between">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-space-dust">
                      {g.short}
                    </div>
                    <div
                      className={`flex items-center gap-1 font-mono text-[11px] tabular ${
                        g.trend >= 0 ? "text-nova-green" : "text-nova-red"
                      }`}
                    >
                      {g.trend >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {formatPct(g.trend)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-[18px] font-medium leading-tight tracking-tight text-space-white">
                      {g.name}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="font-mono text-[12px] text-space-lunar tabular">
                        {formatNumber(g.lots)}
                      </span>
                      <span className="font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                        лотов
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover sweep */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
