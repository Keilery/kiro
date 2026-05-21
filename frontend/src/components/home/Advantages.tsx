"use client";

import { Shield, Zap, Clock, Wallet, Lock, Sparkles } from "lucide-react";
import { GravityScroll } from "@/components/cosmic/GravityScroll";
import { OrbitCard } from "@/components/ui/OrbitCard";

const items = [
  {
    icon: Shield,
    title: "Эскроу-защита",
    body: "Деньги покупателя замораживаются до подтверждения получения. Продавец защищён от ложных чарджбэков, покупатель — от потери средств.",
    spec: "T+0 hold · 256-bit"
  },
  {
    icon: Zap,
    title: "Авто-выдача",
    body: "Цифровые ключи, аккаунты и подписки выдаются мгновенно через зашифрованную auto-delivery шину. Среднее время — 9 секунд.",
    spec: "AES-256 · 9s avg"
  },
  {
    icon: Lock,
    title: "KYC-верификация",
    body: "Продавцы с оборотом от $500 проходят верификацию документов. Бейдж KYC отображается в карточке — мошенникам сюда не попасть.",
    spec: "ID + selfie · 24h"
  },
  {
    icon: Clock,
    title: "24/7 саппорт",
    body: "Команда модераторов и AI-помощник решают споры в среднем за 6 минут. Чат, тикеты и видео-арбитраж — на одной орбите.",
    spec: "6 мин avg dispute"
  },
  {
    icon: Wallet,
    title: "Мульти-валюты",
    body: "Принимаем карты, СБП, ЮMoney, криптовалюту (USDT, BTC) и баланс KOCMOC. Без скрытых конвертационных комиссий.",
    spec: "RUB · USD · EUR · USDT · BTC"
  },
  {
    icon: Sparkles,
    title: "AI-рекомендации",
    body: "Алгоритм изучает историю покупок и предлагает товары, которые тебе действительно нужны — без шума и спама.",
    spec: "Personalized · v3.2"
  }
];

export function Advantages() {
  return (
    <section className="relative py-32">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <GravityScroll className="mb-16 max-w-[640px]">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
            // 05 · преимущества KOCMOC
          </div>
          <h2 className="mt-5 headline-hero text-[clamp(32px,4.4vw,64px)] text-space-white">
            Защита,
            <br />
            <span className="text-space-white/40">встроенная в орбиту</span>
          </h2>
        </GravityScroll>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <GravityScroll key={it.title} delay={i * 0.06}>
              <OrbitCard
                interactive
                glow
                className="group relative h-full overflow-hidden p-7 lg:p-8"
              >
                {/* Декоративный фон — орбита */}
                <div
                  aria-hidden
                  className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full border border-white/[0.05] transition-transform duration-700 group-hover:scale-110"
                />
                <div
                  aria-hidden
                  className="absolute -bottom-10 -right-10 h-28 w-28 rounded-full border border-white/[0.08]"
                />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] transition-all duration-500 group-hover:scale-110 group-hover:border-white/25 group-hover:shadow-halo-white">
                      <it.icon className="h-5 w-5 text-space-lunar" strokeWidth={1.4} />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-space-dust">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-[22px] font-medium tracking-tight text-space-white">
                    {it.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-space-lunar/75">
                    {it.body}
                  </p>

                  <div className="mt-6 inline-flex items-center gap-2 border-t border-white/[0.06] pt-3 font-mono text-[11px] uppercase tracking-wider text-space-dust">
                    <span className="block h-px w-5 bg-white/30" />
                    {it.spec}
                  </div>
                </div>
              </OrbitCard>
            </GravityScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
