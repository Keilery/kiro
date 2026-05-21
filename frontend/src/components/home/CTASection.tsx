"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { GravityScroll } from "@/components/cosmic/GravityScroll";
import { SpaceButton } from "@/components/ui/SpaceButton";

export function CTASection() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <GravityScroll>
          <div className="relative overflow-hidden rounded-orbit-lg border border-white/[0.08] bg-space-deep/70 backdrop-blur-md">
            {/* Декорация: 3 концентрические окружности справа */}
            <div className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full border border-white/[0.06]">
              <div className="absolute inset-12 rounded-full border border-white/[0.08]">
                <div className="absolute inset-12 rounded-full border border-white/[0.10]">
                  <div className="absolute inset-12 flex items-center justify-center">
                    <div className="h-24 w-24 rounded-full bg-space-white/95 shadow-halo-strong">
                      <div
                        aria-hidden
                        className="absolute inset-0 animate-halo-breathe rounded-full bg-space-white/30 blur-2xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Star background */}
            <div
              aria-hidden
              className="absolute inset-0 cosmic-grid-fine opacity-50"
            />

            <div className="relative px-7 py-16 lg:px-16 lg:py-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-[560px]"
              >
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
                  // 07 · точка входа
                </div>
                <h2 className="mt-5 headline-hero text-[clamp(38px,5vw,76px)] text-space-white">
                  Выйди на<br />
                  орбиту<br />
                  <span className="text-space-white/40">KOCMOC.</span>
                </h2>
                <p className="mt-6 text-[16px] leading-relaxed text-space-lunar/80">
                  Регистрация занимает 30 секунд. Первая сделка — бесплатно
                  (комиссия 0% на дебют). Эскроу включается автоматически.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Link href="/auth/register">
                    <SpaceButton size="lg" iconRight={<ArrowUpRight className="h-4 w-4" />}>
                      Создать аккаунт
                    </SpaceButton>
                  </Link>
                  <Link href="/catalog">
                    <SpaceButton size="lg" variant="secondary">
                      Смотреть каталог
                    </SpaceButton>
                  </Link>
                </div>

                <div className="mt-10 flex items-center gap-6 border-t border-white/[0.06] pt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-space-dust">
                  <span>· No KYC до $500</span>
                  <span>· 0% на 1й лот</span>
                  <span>· 4.5% комиссия</span>
                </div>
              </motion.div>
            </div>
          </div>
        </GravityScroll>
      </div>
    </section>
  );
}
