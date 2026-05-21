"use client";

import { motion } from "framer-motion";
import { GravityScroll } from "@/components/cosmic/GravityScroll";

const steps = [
  {
    n: "01",
    title: "Запуск",
    body: "Создай аккаунт. Если планируешь продавать на сумму больше $500 — пройди KYC. Это занимает 24 часа.",
    code: "AUTH → KYC → PROFILE"
  },
  {
    n: "02",
    title: "Сделка",
    body: "Покупатель выбирает товар. Деньги замораживаются в эскроу-зоне. Продавец получает уведомление и выдаёт товар.",
    code: "ESCROW.hold(amount)"
  },
  {
    n: "03",
    title: "Передача",
    body: "Для авто-выдачи — мгновенно через зашифрованную auto-delivery шину. Для ручной — через встроенный чат с продавцом.",
    code: "AUTO ⚡ 9s · MANUAL · chat"
  },
  {
    n: "04",
    title: "Закрытие",
    body: "Покупатель подтверждает. Деньги переходят продавцу за вычетом 4.5% комиссии. Можно оставить отзыв.",
    code: "ESCROW.release() · REVIEW"
  }
];

export function HowItWorks() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-[1fr_2fr] lg:gap-24">
          <GravityScroll className="lg:sticky lg:top-32 lg:self-start">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
              // 06 · протокол сделки
            </div>
            <h2 className="mt-5 headline-hero text-[clamp(32px,4.4vw,56px)] text-space-white">
              Как
              <br />
              работает
              <br />
              <span className="text-space-white/40">KOCMOC</span>
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-space-lunar/70">
              Четыре фазы — от первого клика до перевода денег продавцу. Без
              посредников и серой логистики.
            </p>
          </GravityScroll>

          <div className="relative">
            {/* Вертикальная орбитальная линия */}
            <div
              aria-hidden
              className="absolute left-[18px] top-0 hidden h-full w-px bg-gradient-to-b from-white/30 via-white/10 to-transparent lg:block"
            />
            <div className="space-y-10">
              {steps.map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="relative pl-0 lg:pl-14"
                >
                  {/* Маркер */}
                  <div
                    aria-hidden
                    className="absolute left-0 top-0 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-white/15 bg-space-black lg:flex"
                    style={{ left: "18px" }}
                  >
                    <div className="h-2 w-2 rounded-full bg-space-white shadow-halo-white" />
                  </div>

                  <div className="rounded-orbit border border-white/[0.07] bg-white/[0.025] p-7 transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-[42px] font-medium tracking-tight text-space-white/30 tabular">
                        {s.n}
                      </span>
                      <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-space-dust">
                        фаза
                      </span>
                    </div>
                    <h3 className="mt-2 font-display text-[24px] font-medium tracking-tight text-space-white">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-space-lunar/75">
                      {s.body}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-space-black/40 px-3 py-1.5 font-mono text-[11.5px] text-nova-green/90">
                      <span className="block h-1.5 w-1.5 rounded-full bg-nova-green" />
                      {s.code}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
