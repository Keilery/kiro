"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet,
  ShoppingBag,
  Package,
  MessageCircle,
  Bell,
  Settings,
  ShieldCheck,
  Star,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  CircleUserRound,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OrbitCard } from "@/components/ui/OrbitCard";
import { SpaceButton } from "@/components/ui/SpaceButton";
import { formatPrice } from "@/lib/format";

const nav = [
  { name: "Обзор", href: "/dashboard", icon: TrendingUp, active: true },
  { name: "Покупки", href: "/dashboard", icon: ShoppingBag },
  { name: "Продажи", href: "/dashboard", icon: Package },
  { name: "Баланс", href: "/dashboard", icon: Wallet },
  { name: "Сообщения", href: "/chat", icon: MessageCircle, badge: 3 },
  { name: "Уведомления", href: "/dashboard", icon: Bell },
  { name: "KYC", href: "/security#kyc", icon: ShieldCheck },
  { name: "Настройки", href: "/dashboard", icon: Settings }
];

const recentOrders = [
  { id: "K2026-0421", product: "Prime CS2 + FACEIT 2200", seller: "Nova_Carry", amount: 14_900, status: "DELIVERED", time: "12 мин" },
  { id: "K2026-0420", product: "Spotify Family · 12 мес", seller: "OrbitMedia", amount: 1_490, status: "COMPLETED", time: "2 ч" },
  { id: "K2026-0419", product: "Genshin Genesis 6480", seller: "MoonStar_GI", amount: 6_290, status: "IN_PROGRESS", time: "вчера" },
  { id: "K2026-0418", product: "Discord Nitro · 1 год", seller: "OrbitMedia", amount: 2_690, status: "COMPLETED", time: "3 дня" },
  { id: "K2026-0417", product: "WoW · 100k золота EU", seller: "Halo_Trader", amount: 4_280, status: "COMPLETED", time: "неделя" }
];

const statusMap = {
  PENDING_PAYMENT: { label: "Оплата", variant: "warning" as const },
  PAID: { label: "Оплачен", variant: "info" as const },
  IN_PROGRESS: { label: "В работе", variant: "info" as const },
  DELIVERED: { label: "Выдан", variant: "warning" as const },
  COMPLETED: { label: "Завершён", variant: "success" as const },
  DISPUTED: { label: "Спор", variant: "danger" as const }
};

export default function DashboardPage() {
  return (
    <section className="relative pt-28 pb-20">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <ProfileSummary />
            <nav className="mt-8 space-y-1">
              {nav.map((n) => (
                <Link
                  key={n.name}
                  href={n.href}
                  className={`flex items-center justify-between rounded-orbit-sm px-3.5 py-2.5 text-[13.5px] transition-all ${
                    n.active
                      ? "bg-white/[0.06] text-space-white shadow-orbit-edge"
                      : "text-space-lunar/80 hover:bg-white/[0.04] hover:text-space-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <n.icon className="h-4 w-4" strokeWidth={1.5} />
                    {n.name}
                  </span>
                  {n.badge && (
                    <span className="rounded-full bg-space-white px-1.5 font-mono text-[10px] text-space-black tabular">
                      {n.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="space-y-7">
            {/* Header */}
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
                  // личная орбита
                </div>
                <h1 className="mt-3 headline-hero text-[clamp(28px,3.5vw,44px)] text-space-white">
                  Привет, ArtemR_
                </h1>
              </div>
              <SpaceButton iconLeft={<Sparkles className="h-4 w-4" />}>
                Создать лот
              </SpaceButton>
            </div>

            {/* Balance + stats */}
            <BalanceBlock />
            <StatsRow />

            {/* Recent orders */}
            <OrbitCard className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
                <div>
                  <h2 className="font-display text-[18px] font-medium text-space-white">
                    Последние сделки
                  </h2>
                  <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.18em] text-space-dust">
                    орбита · последние 7 дней
                  </div>
                </div>
        <Link
          href="/dashboard"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-space-lunar hover:text-space-white"
        >
          Все →
        </Link>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {recentOrders.map((o, i) => {
                  const st = statusMap[o.status as keyof typeof statusMap];
                  return (
                    <motion.div
                      key={o.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.5 }}
                      className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.04] font-mono text-[11px] text-space-white">
                          {o.product.slice(0, 1)}
                        </div>
                        <div>
                          <div className="text-[13.5px] text-space-white">{o.product}</div>
                          <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                            <span>{o.id}</span>
                            <span>·</span>
                            <span>{o.seller}</span>
                            <span>·</span>
                            <span>{o.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={st.variant}>{st.label}</Badge>
                        <span className="font-mono text-[14px] font-medium text-space-white tabular">
                          {formatPrice(o.amount)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </OrbitCard>

            {/* AI Recommendations */}
            <AIRecommendations />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileSummary() {
  return (
    <OrbitCard glow inset className="p-5">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] font-mono text-[14px] text-space-white">
            AR
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-nova-green ring-2 ring-space-deep" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 font-display text-[15px] font-medium text-space-white">
            ArtemR_
            <ShieldCheck className="h-3.5 w-3.5 text-nova-green" />
          </div>
          <div className="flex items-center gap-1.5 text-[11.5px] text-space-lunar/80">
            <Star className="h-3 w-3 fill-current text-space-white" />
            4.98 · 184 сделок
          </div>
        </div>
      </div>
    </OrbitCard>
  );
}

function BalanceBlock() {
  return (
    <OrbitCard inset className="relative overflow-hidden p-7 lg:p-9">
      <div
        aria-hidden
        className="absolute -right-32 -top-32 h-[320px] w-[320px] rounded-full border border-white/[0.05]"
      >
        <div className="absolute inset-10 rounded-full border border-white/[0.08]" />
        <div className="absolute inset-20 rounded-full border border-white/[0.12]" />
      </div>

      <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
            доступный баланс
          </div>
          <div className="mt-3 font-display text-[56px] font-medium leading-none tracking-tight text-space-white tabular md:text-[72px]">
            ₽ 28 412
          </div>
          <div className="mt-2 flex items-center gap-3 font-mono text-[12px] text-space-dust">
            <span>≈ $321</span>
            <span>·</span>
            <span>314 ₮ USDT</span>
            <span>·</span>
            <span className="text-nova-green">+12.4% за месяц</span>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <SpaceButton iconLeft={<ArrowDownLeft className="h-4 w-4" />}>Пополнить</SpaceButton>
            <SpaceButton variant="secondary" iconLeft={<ArrowUpRight className="h-4 w-4" />}>
              Вывести
            </SpaceButton>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 self-end md:grid-cols-1">
          {[
            { k: "Заморожено в эскроу", v: "₽ 8 200" },
            { k: "Ожидает выплаты", v: "₽ 4 100" }
          ].map((s) => (
            <div
              key={s.k}
              className="rounded-orbit-sm border border-white/[0.06] bg-white/[0.025] p-4"
            >
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
                {s.k}
              </div>
              <div className="mt-1.5 font-display text-[20px] font-medium tabular text-space-white">
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </OrbitCard>
  );
}

function StatsRow() {
  const stats = [
    { label: "Покупок за месяц", value: "21", trend: "+34%" },
    { label: "Продаж за месяц", value: "94", trend: "+12%" },
    { label: "Средняя оценка", value: "4.98", trend: "+0.02" },
    { label: "Открытых споров", value: "0", trend: "—" }
  ];
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {stats.map((s) => (
        <OrbitCard key={s.label} className="p-5">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
            {s.label}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <div className="font-display text-[26px] font-medium tabular text-space-white">
              {s.value}
            </div>
            <div className="font-mono text-[11px] text-nova-green tabular">{s.trend}</div>
          </div>
        </OrbitCard>
      ))}
    </div>
  );
}

function AIRecommendations() {
  const recs = [
    { title: "Valorant Radiant + все агенты", price: 22_400, game: "VAL" },
    { title: "Telegram Premium · 3 мес", price: 690, game: "TG" },
    { title: "Dota 2 · буст 4000→5000", price: 8_800, game: "DOTA" }
  ];
  return (
    <OrbitCard className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-space-white" />
          <h2 className="font-display text-[17px] font-medium text-space-white">
            AI · подбор под твою орбиту
          </h2>
        </div>
        <Badge variant="info">v3.2 · personalized</Badge>
      </div>
      <div className="mt-5 grid gap-2 md:grid-cols-3">
        {recs.map((r) => (
          <Link
            key={r.title}
            href="/catalog"
            className="group flex items-center gap-3 rounded-orbit-sm border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-space-black/60 font-mono text-[12px] text-space-white">
              {r.game}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] text-space-white">{r.title}</div>
              <div className="font-mono text-[12px] text-space-lunar tabular">
                {formatPrice(r.price)}
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-space-dust transition-colors group-hover:text-space-white" />
          </Link>
        ))}
      </div>
    </OrbitCard>
  );
}
