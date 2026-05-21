"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { SpaceButton } from "@/components/ui/SpaceButton";
import { Badge } from "@/components/ui/Badge";

const PlanetHero = dynamic(
  () => import("@/components/cosmic/PlanetHero").then((m) => m.PlanetHero),
  { ssr: false }
);

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] as const }
});

export function Hero() {
  return (
    <section className="relative isolate min-h-[100dvh] overflow-hidden pt-24">
      {/* ───── Атмосфера ───── */}
      <div className="absolute inset-0 cosmic-grid mask-radial-fade opacity-50" />
      <div
        aria-hidden
        className="absolute inset-0 cosmic-vignette opacity-80"
      />

      {/* ───── 3D Планета ───── */}
      <div className="absolute inset-0 z-[1] mask-fade-bottom">
        <PlanetHero />
      </div>

      {/* ───── Контент ───── */}
      <div className="relative z-10 mx-auto max-w-[1400px] px-5 lg:px-8">
        <div className="grid grid-cols-1 items-center lg:min-h-[80vh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="relative">
            <motion.div {...stagger(0)} className="mb-6 inline-flex">
              <Badge dot variant="success" className="!text-[10.5px]">
                Live · 8 412 онлайн · средн. сделка 6 мин
              </Badge>
            </motion.div>

            <motion.h1
              {...stagger(1)}
              className="headline-mega text-[clamp(48px,8.5vw,128px)] text-space-white"
            >
              Маркетплейс
              <br />
              <span className="text-space-white/40">цифровой</span>
              <br />
              вселенной.
            </motion.h1>

            <motion.p
              {...stagger(2)}
              className="mt-7 max-w-[520px] text-[16px] leading-relaxed text-space-lunar/80 lg:text-[17px]"
            >
              Аккаунты, валюта, подписки и услуги — со скоростью света.
              Эскроу-защита, KYC-верификация продавцов и мгновенная авто-выдача
              в едином чёрно-белом интерфейсе.
            </motion.p>

            <motion.div {...stagger(3)} className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/catalog">
                <SpaceButton size="lg" iconRight={<ArrowUpRight className="h-4 w-4" />}>
                  Запустить каталог
                </SpaceButton>
              </Link>
              <Link href="/dashboard/sell">
                <SpaceButton
                  size="lg"
                  variant="secondary"
                  iconLeft={<Sparkles className="h-4 w-4" />}
                >
                  Стать продавцом
                </SpaceButton>
              </Link>
            </motion.div>

            {/* Hero stats */}
            <motion.div
              {...stagger(4)}
              className="mt-14 grid max-w-[560px] grid-cols-3 gap-6 border-t border-white/[0.08] pt-7"
            >
              {[
                { label: "Активные сделки", value: "4 122", sub: "за сегодня" },
                { label: "Продавцов KYC", value: "12.8K", sub: "верифицировано" },
                { label: "Среднее время", value: "9 сек", sub: "до выдачи" }
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-display text-[28px] font-medium tracking-tight text-space-white tabular">
                    {s.value}
                  </div>
                  <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                    {s.label}
                  </div>
                  <div className="text-[11px] text-space-dust/70">{s.sub}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Правая колонка — пустая, чтобы планета дышала; декоративные индикаторы */}
          <div className="relative hidden h-full lg:block">
            <div className="absolute right-0 top-[12%]">
              <CoordinateLabel coords="14°22'N · 7°44'E" label="ОРБИТА · 401KM" />
            </div>
            <div className="absolute right-12 top-[58%]">
              <CoordinateLabel coords="STATUS · NOMINAL" label="ДРЕЙФ · 0.0012" muted />
            </div>
            <div className="absolute right-0 bottom-[6%]">
              <CoordinateLabel coords="P2P · ESCROW · LIVE" label="ПРОТОКОЛ KOCMOC/1.0" />
            </div>
          </div>
        </div>
      </div>

      {/* ───── Scroll indicator ───── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-space-dust">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em]">
            прокрутка
          </span>
          <div className="relative h-9 w-px bg-white/15">
            <div className="absolute inset-x-[-2px] top-0 h-3 animate-drift bg-white/80" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function CoordinateLabel({
  coords,
  label,
  muted
}: {
  coords: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "opacity-50" : ""}>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-space-dust">
        <span className="block h-px w-6 bg-white/30" />
        {label}
      </div>
      <div className="mt-1 font-mono text-[12px] text-space-lunar tabular">
        {coords}
      </div>
    </div>
  );
}
