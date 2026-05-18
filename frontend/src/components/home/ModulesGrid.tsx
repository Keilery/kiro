"use client";

import { motion } from "framer-motion";
import {
  ShoppingBag,
  Store,
  Gamepad2,
  Bot,
  LifeBuoy,
  UserCircle,
  Shield,
  CreditCard,
  Bell,
  Code2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";

const MODULES = [
  {
    href: "/marketplace",
    icon: ShoppingBag,
    title: "Маркетплейс",
    count: 82,
    desc: "Листинги, фильтры, эскроу, диспуты, отзывы, чат.",
    span: "md:col-span-2"
  },
  {
    href: "/shop",
    icon: Store,
    title: "Магазин",
    count: 50,
    desc: "Официальные товары, корзина, промокоды, кэшбэк.",
    span: ""
  },
  {
    href: "/rental",
    icon: Gamepad2,
    title: "Аренда игр",
    count: 40,
    desc: "Тарифы 1ч–30д, авто-логин, очередь, продление.",
    span: ""
  },
  {
    href: "/automation",
    icon: Bot,
    title: "Автоматизация",
    count: 60,
    desc: "FunPay, Starvell, Playerok. Боты, парсеры, синки.",
    span: "md:col-span-2"
  },
  {
    href: "/admin",
    icon: Shield,
    title: "Админ-панель",
    count: 70,
    desc: "Метрики, RBAC, модерация, финансы, аудит.",
    span: ""
  },
  {
    href: "/profile",
    icon: UserCircle,
    title: "Профиль",
    count: 50,
    desc: "Витрина, бейджи, кошелёк, рефералка, 2FA.",
    span: ""
  },
  {
    href: "/support",
    icon: LifeBuoy,
    title: "Поддержка",
    count: 35,
    desc: "Тикеты, FAQ, AI-бот, SLA, status page.",
    span: ""
  },
  {
    href: "/orders",
    icon: CreditCard,
    title: "Заказы",
    count: 40,
    desc: "Эскроу, авто-доставка, гарантия, invoice.",
    span: ""
  },
  {
    href: "/api/docs",
    icon: Code2,
    title: "API & SDK",
    count: 30,
    desc: "REST + GraphQL + WebSocket, webhooks, OAuth2.",
    span: ""
  },
  {
    href: "/notifications",
    icon: Bell,
    title: "Уведомления",
    count: 30,
    desc: "Push, email, Telegram, Discord, SMS, in-app.",
    span: "md:col-span-2"
  }
];

export function ModulesGrid() {
  return (
    <section className="relative px-6 py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <div className="eyebrow mb-3">12 модулей · 552 функции</div>
            <h2 className="display max-w-3xl text-[clamp(36px,5vw,64px)] text-white">
              Всё, что нужно платформе.
              <br />
              <span className="text-white/45">В одном месте.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {MODULES.map((m, i) => (
            <ModuleCard key={m.href} m={m} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModuleCard({
  m,
  i
}: {
  m: (typeof MODULES)[number];
  i: number;
}) {
  const Icon = m.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        type: "spring",
        stiffness: 110,
        damping: 22,
        delay: (i % 4) * 0.06
      }}
      className={cn("relative", m.span)}
    >
      <Link
        href={m.href}
        className={cn(
          "group relative block h-full overflow-hidden rounded-ios border border-white/[0.07] bg-white/[0.02] p-7",
          "transition-all duration-500 ease-out-expo",
          "hover:border-white/20 hover:bg-white/[0.05]"
        )}
      >
        {/* hover halo — GPU-only */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-[1px] rounded-ios opacity-0 transition-opacity duration-500 ease-out-expo group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(80% 60% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)"
          }}
        />
        <div className="relative flex h-full flex-col">
          <div className="flex items-center justify-between">
            <span className="grid h-11 w-11 place-items-center rounded-ios-sm bg-white/10 text-white">
              <Icon className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span className="num text-[12px] tracking-tight text-white/35 group-hover:text-white/70 transition-colors">
              {m.count} fn
            </span>
          </div>
          <h3 className="mt-8 text-[22px] font-semibold tracking-tight text-white">
            {m.title}
          </h3>
          <p className="mt-1.5 max-w-[36ch] text-[13.5px] leading-relaxed text-white/55">
            {m.desc}
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 text-[12.5px] text-white/45 transition-colors group-hover:text-white">
            Перейти
            <span className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
