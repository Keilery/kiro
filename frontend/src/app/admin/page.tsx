"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Users,
  Package,
  AlertTriangle,
  ShieldCheck,
  ArrowDownLeft,
  TrendingUp,
  Search,
  Settings,
  ListChecks,
  Wallet,
  ScrollText
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { OrbitCard } from "@/components/ui/OrbitCard";
import { CosmicInput } from "@/components/ui/CosmicInput";
import { adminUsers } from "@/lib/mock-data";
import { formatNumber } from "@/lib/format";

const nav = [
  { name: "Обзор", icon: TrendingUp, active: true },
  { name: "Пользователи", icon: Users, count: "12 847" },
  { name: "Товары", icon: Package, count: "89 231" },
  { name: "Заказы", icon: ListChecks, count: "4 122" },
  { name: "KYC", icon: ShieldCheck, count: "42", urgent: true },
  { name: "Споры", icon: AlertTriangle, count: "12", urgent: true },
  { name: "Платежи", icon: Wallet, count: "208" },
  { name: "Аудит", icon: ScrollText },
  { name: "Настройки", icon: Settings }
];

export default function AdminPage() {
  return (
    <section className="relative pt-24 pb-20">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        {/* Top bar */}
        <div className="mb-8 flex flex-col gap-4 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge dot variant="success">KOCMOC · Mission control</Badge>
              <Badge variant="warning">v0.1 · staging</Badge>
            </div>
            <h1 className="mt-4 headline-hero text-[clamp(32px,4vw,52px)] text-space-white">
              Центр управления
            </h1>
          </div>
          <div className="w-full max-w-md">
            <CosmicInput
              iconLeft={<Search className="h-4 w-4" />}
              placeholder="Поиск по ID, юзеру, ордеру…"
            />
          </div>
        </div>

        <div className="grid gap-7 lg:grid-cols-[220px_1fr] lg:gap-9">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="space-y-1">
              {nav.map((n) => (
                <button
                  key={n.name}
                  className={`flex w-full items-center justify-between rounded-orbit-sm px-3.5 py-2.5 text-[13px] transition-all ${
                    n.active
                      ? "bg-white/[0.06] text-space-white shadow-orbit-edge"
                      : "text-space-lunar/80 hover:bg-white/[0.04] hover:text-space-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <n.icon className="h-4 w-4" strokeWidth={1.5} />
                    {n.name}
                  </span>
                  {n.count && (
                    <span
                      className={`rounded-full px-1.5 font-mono text-[10px] tabular ${
                        n.urgent
                          ? "bg-nova-amber/20 text-nova-amber"
                          : "bg-white/[0.06] text-space-dust"
                      }`}
                    >
                      {n.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-7 rounded-orbit-sm border border-white/[0.06] bg-white/[0.025] p-4">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
                админ
              </div>
              <div className="mt-1.5 font-display text-[15px] font-medium text-space-white">
                David Kritsky
              </div>
              <div className="mt-0.5 font-mono text-[10.5px] text-space-dust">SUPER_ADMIN</div>
            </div>
          </aside>

          {/* Content */}
          <div className="space-y-7">
            <MetricCards />
            <RevenueBlock />
            <div className="grid gap-3 lg:grid-cols-2">
              <UsersTable />
              <KycQueue />
            </div>
            <AuditLogStrip />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricCards() {
  const cards = [
    { icon: Wallet, label: "GMV сегодня", value: "₽ 4.21M", sub: "+18.4% к вчера" },
    { icon: Users, label: "Активных юзеров", value: "8 412", sub: "пик за неделю" },
    { icon: AlertTriangle, label: "Споров открыто", value: "12", sub: "медиана 6 мин" },
    { icon: ShieldCheck, label: "KYC в очереди", value: "42", sub: "оценка 9.4 / 10" }
  ];
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.5 }}
        >
          <OrbitCard className="relative overflow-hidden p-5">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full border border-white/[0.06]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <c.icon className="h-4 w-4 text-space-lunar" strokeWidth={1.3} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-space-dust">
                  live
                </span>
              </div>
              <div className="mt-4 font-display text-[26px] font-medium tracking-tight tabular text-space-white">
                {c.value}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-wider text-space-dust">
                {c.label}
              </div>
              <div className="mt-3 text-[11.5px] text-nova-green tabular">{c.sub}</div>
            </div>
          </OrbitCard>
        </motion.div>
      ))}
    </div>
  );
}

function RevenueBlock() {
  const series = [38, 42, 39, 48, 51, 55, 62, 58, 64, 71, 68, 78, 81, 85, 92, 88, 95, 102, 99, 110, 118, 121, 130, 142];
  const max = Math.max(...series);
  return (
    <OrbitCard className="relative overflow-hidden p-7">
      <div className="flex items-start justify-between border-b border-white/[0.05] pb-5">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
            // GMV · последние 24ч
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="font-display text-[40px] font-medium tabular text-space-white">
              ₽ 4 212 870
            </div>
            <div className="font-mono text-[12px] text-nova-green tabular">+18.4%</div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {["24ч", "7д", "30д", "год"].map((p, i) => (
            <button
              key={p}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all ${
                i === 0
                  ? "border-space-white bg-space-white text-space-black"
                  : "border-white/10 bg-white/[0.025] text-space-dust hover:border-white/25"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Bar chart */}
      <div className="mt-7 flex h-44 items-end gap-1">
        {series.map((v, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ delay: 0.02 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-white/[0.06] via-white/40 to-space-white"
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-wider text-space-dust">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>сейчас</span>
      </div>
    </OrbitCard>
  );
}

function UsersTable() {
  return (
    <OrbitCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <h3 className="font-display text-[15px] font-medium text-space-white">
            Свежие пользователи
          </h3>
          <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
            последние 7 регистраций
          </div>
        </div>
        <button className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-lunar hover:text-space-white">
          Все →
        </button>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {adminUsers.map((u) => (
          <div
            key={u.username}
            className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] font-mono text-[10px] text-space-white">
                  {u.username.slice(0, 1)}
                </div>
                {u.status === "active" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-nova-green ring-2 ring-space-deep" />
                )}
                {u.status === "banned" && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-nova-red ring-2 ring-space-deep" />
                )}
              </div>
              <div>
                <div className="text-[13px] text-space-white">{u.username}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                  {u.role} · {u.joined}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {u.kyc === "APPROVED" && (
                <Badge variant="success" icon={<ShieldCheck className="h-3 w-3" />}>
                  KYC
                </Badge>
              )}
              {u.kyc === "PENDING" && <Badge variant="warning">KYC ожид.</Badge>}
              {u.kyc === "REJECTED" && <Badge variant="danger">KYC откл.</Badge>}
              {u.status === "banned" && <Badge variant="danger">BAN</Badge>}
              {u.status === "frozen" && <Badge variant="warning">FROZEN</Badge>}
            </div>
          </div>
        ))}
      </div>
    </OrbitCard>
  );
}

function KycQueue() {
  const items = [
    { user: "ShadowFox", docs: "ID + selfie", time: "8 мин", score: 8.4 },
    { user: "Apex_Pilot", docs: "Паспорт + selfie", time: "23 мин", score: 9.1 },
    { user: "RocketGirl", docs: "ID + адрес", time: "1 ч", score: 7.2 },
    { user: "NebulaTrade", docs: "Паспорт + selfie", time: "2 ч", score: 9.6 },
    { user: "CometSeller", docs: "ID + selfie", time: "5 ч", score: 6.8 }
  ];
  return (
    <OrbitCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <h3 className="font-display text-[15px] font-medium text-space-white">
            KYC очередь
          </h3>
          <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
            ожидают модерации
          </div>
        </div>
        <Badge variant="warning">42 заявки</Badge>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {items.map((it) => (
          <div
            key={it.user}
            className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-white/[0.02]"
          >
            <div>
              <div className="text-[13px] text-space-white">{it.user}</div>
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                {it.docs} · {it.time}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-mono text-[12px] tabular text-space-white">
                  AI score · {it.score}
                </div>
                <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full ${
                      it.score >= 8 ? "bg-nova-green" : it.score >= 6.5 ? "bg-nova-amber" : "bg-nova-red"
                    }`}
                    style={{ width: `${(it.score / 10) * 100}%` }}
                  />
                </div>
              </div>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full border border-nova-green/30 bg-nova-green/10 text-nova-green transition-all hover:bg-nova-green/20"
                aria-label="Approve"
              >
                ✓
              </button>
            </div>
          </div>
        ))}
      </div>
    </OrbitCard>
  );
}

function AuditLogStrip() {
  const logs = [
    { actor: "system", action: "ORDER.escrow.released", target: "K2026-0421", time: "13:42:18" },
    { actor: "moderator_v2", action: "DISPUTE.resolve", target: "DSP-0098", time: "13:39:02" },
    { actor: "kyc_bot", action: "KYC.approve", target: "NebulaTrade", time: "13:38:51" },
    { actor: "system", action: "PRODUCT.auto_delete", target: "p_94821", time: "13:37:33" },
    { actor: "admin:david", action: "USER.ban", target: "FraudGhost", time: "13:32:14" }
  ];
  return (
    <OrbitCard className="relative overflow-hidden">
      <div className="scan-overlay absolute inset-0" />
      <div className="relative">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h3 className="font-display text-[15px] font-medium text-space-white">
              Аудит · поток событий
            </h3>
            <div className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
              kocmoc · audit-log · realtime
            </div>
          </div>
          <Badge dot variant="success">streaming</Badge>
        </div>
        <div className="divide-y divide-white/[0.04] font-mono text-[12px]">
          {logs.map((l, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-2.5">
              <span className="w-20 text-space-dust tabular">{l.time}</span>
              <span className="w-32 truncate text-space-lunar/85">{l.actor}</span>
              <span className="flex-1 truncate text-space-white">{l.action}</span>
              <span className="text-nova-blue">{l.target}</span>
            </div>
          ))}
        </div>
      </div>
    </OrbitCard>
  );
}
