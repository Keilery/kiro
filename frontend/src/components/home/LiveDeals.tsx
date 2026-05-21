"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Activity, Zap, ShieldCheck } from "lucide-react";
import { GravityScroll } from "@/components/cosmic/GravityScroll";
import { Badge } from "@/components/ui/Badge";
import { liveDeals } from "@/lib/mock-data";

export function LiveDeals() {
  // Ротация по кругу каждые 4с — без AnimatePresence remount, чтобы лента
  // была видна и при первичном рендере, и при последующих сдвигах.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const offset = tick % liveDeals.length;
  const items = [...liveDeals.slice(offset), ...liveDeals.slice(0, offset)];

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <GravityScroll>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
              // 03 · телеметрия живых сделок
            </div>
            <h2 className="mt-5 headline-hero text-[clamp(32px,4.4vw,60px)] text-space-white">
              Сейчас в орбите —<br />
              <span className="text-space-white/40">в реальном времени</span>
            </h2>
            <p className="mt-6 max-w-[480px] text-[15px] leading-relaxed text-space-lunar/75">
              Каждая сделка проходит через эскроу-зону: деньги покупателя
              заморожены, продавец видит подтверждение, выдача регистрируется в
              цепочке. Лента обновляется автоматически.
            </p>

            {/* Mini-metrics */}
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-[480px]">
              {[
                { icon: Activity, value: "9 сек", label: "среднее время выдачи" },
                { icon: Zap, value: "98.4%", label: "авто-сделок" },
                { icon: ShieldCheck, value: "0.01%", label: "споров от GMV" }
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.05 * i, duration: 0.5 }}
                >
                  <m.icon className="h-4 w-4 text-space-lunar" strokeWidth={1.3} />
                  <div className="mt-3 font-display text-[24px] font-medium text-space-white tabular">
                    {m.value}
                  </div>
                  <div className="mt-0.5 text-[11.5px] leading-tight text-space-dust">
                    {m.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </GravityScroll>

          {/* Лента сделок */}
          <GravityScroll delay={0.1}>
            <div className="relative overflow-hidden rounded-orbit-lg border border-white/[0.07] bg-space-deep/60 backdrop-blur-md">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                <Badge dot variant="success">
                  Live · synchronized
                </Badge>
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                  KOCMOC · feed-001
                </div>
              </div>

              {/* Лента */}
              <div className="relative h-[420px] overflow-hidden mask-fade-bottom">
                <div className="divide-y divide-white/[0.04]">
                  {items.slice(0, 6).map((d, i) => (
                    <motion.div
                      key={`${d.buyer}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] font-mono text-[11px] text-space-white">
                            {d.buyer.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-nova-green ring-2 ring-space-deep" />
                        </div>
                        <div>
                          <div className="text-[13.5px] text-space-white">
                            <span className="text-space-lunar/70">{d.buyer}</span>{" "}
                            купил
                          </div>
                          <div className="mt-0.5 text-[12.5px] text-space-lunar/75">
                            {d.product}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[13.5px] font-medium text-space-white tabular">
                          {d.amount}
                        </div>
                        <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                          {d.timeAgo}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Bottom strip */}
              <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.015] px-6 py-3">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                  поток · 142 / мин
                </div>
                <div className="flex items-center gap-1">
                  <span className="wave-bar text-nova-green" />
                  <span className="wave-bar text-nova-green" />
                  <span className="wave-bar text-nova-green" />
                  <span className="wave-bar text-nova-green" />
                </div>
              </div>
            </div>
          </GravityScroll>
        </div>
      </div>
    </section>
  );
}
