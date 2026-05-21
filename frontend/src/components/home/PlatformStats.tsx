"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import { GravityScroll } from "@/components/cosmic/GravityScroll";
import { platformStats } from "@/lib/mock-data";

function AnimatedNumber({
  value,
  format = (v) => Math.floor(v).toLocaleString("ru-RU"),
  delay = 0
}: {
  value: number;
  format?: (v: number) => string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const m = useMotionValue(0);
  const display = useTransform(m, (v) => format(v));

  useEffect(() => {
    if (!inView) return;
    const controls = animate(m, value, {
      duration: 2.2,
      delay,
      ease: [0.16, 1, 0.3, 1]
    });
    return controls.stop;
  }, [inView, value, m, delay]);

  return (
    <motion.span ref={ref} className="tabular">
      {display}
    </motion.span>
  );
}

const stats = [
  { value: platformStats.sellers, label: "Верифицированных продавцов", suffix: "" },
  { value: platformStats.products, label: "Активных лотов", suffix: "" },
  { value: platformStats.ordersToday, label: "Сделок за сегодня", suffix: "" },
  { value: 142.8, label: "GMV за месяц", suffix: " M ₽", format: (v: number) => v.toFixed(1) },
  { value: platformStats.onlineNow, label: "Онлайн сейчас", suffix: "" },
  { value: platformStats.satisfactionPct, label: "Удовлетворённость", suffix: "%", format: (v: number) => v.toFixed(1) }
];

export function PlatformStats() {
  return (
    <section className="relative py-32 lg:py-40">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <GravityScroll className="mb-20 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
            // 04 · телескопическая статистика
          </div>
          <h2 className="mt-5 headline-hero text-[clamp(36px,5vw,76px)] text-space-white">
            Платформа в цифрах
          </h2>
          <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-relaxed text-space-lunar/70">
            Числа обновляются раз в 12 секунд. Они растут — это значит, кто-то
            прямо сейчас совершает сделку.
          </p>
        </GravityScroll>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-orbit-lg border border-white/[0.07] bg-white/[0.04] md:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className="group relative flex flex-col justify-end overflow-hidden bg-space-deep p-7 md:p-10"
            >
              {/* Decorative bg */}
              <div
                aria-hidden
                className="absolute inset-0 cosmic-grid-fine opacity-40 transition-opacity group-hover:opacity-70"
              />
              <div
                aria-hidden
                className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/[0.02] transition-all duration-700 group-hover:scale-150 group-hover:bg-white/[0.04]"
              />

              <div className="relative">
                <div className="font-display text-[44px] font-medium leading-none tracking-tight text-space-white md:text-[64px]">
                  <AnimatedNumber
                    value={s.value}
                    delay={i * 0.08}
                    format={s.format}
                  />
                  <span className="text-space-white/40">{s.suffix}</span>
                </div>
                <div className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-space-dust">
                  {s.label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
