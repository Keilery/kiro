"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";

const LOGS = [
  { t: "00:14:02", k: "ok", text: "FunPay · автоподнятие 47 лотов", tone: "success" as const },
  { t: "00:14:01", k: "ok", text: "Starvell · sync prices ↔ NexusMarket", tone: "success" as const },
  { t: "00:13:58", k: "ok", text: "Playerok · 3 заказа доставлено", tone: "success" as const },
  { t: "00:13:51", k: "i", text: "Telegram-бот · уведомление продавцу", tone: "neutral" as const },
  { t: "00:13:44", k: "!", text: "Конкурент снизил цену → авто-подстройка", tone: "warning" as const },
  { t: "00:13:30", k: "ok", text: "Discord webhook · /sales summary", tone: "success" as const }
];

export function AutomationShowcase() {
  return (
    <section className="relative px-6 py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-12 lg:grid-cols-[5fr_6fr]">
        <div>
          <div className="eyebrow mb-3">Автоматизация · 60 функций</div>
          <h2 className="display text-[clamp(36px,5vw,64px)] text-white">
            Боты работают,
            <br />
            <span className="text-white/45">пока ты спишь.</span>
          </h2>
          <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-white/60">
            Парсим заказы, синкаем цены, отвечаем покупателям, поднимаем лоты,
            мониторим конкурентов. FunPay, Starvell, Playerok из коробки.
          </p>
          <ul className="mt-8 space-y-3 text-[14px] text-white/70">
            {[
              "Multi-account FunPay c прокси-менеджером",
              "Динамические цены по спросу",
              "Шаблоны автоответов и автоотзывов",
              "Webhook-менеджер с HMAC подписью",
              "Real-time логи и алерты в Telegram/Discord"
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-2 h-1 w-1 rounded-full bg-white/60" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* live logs panel */}
        <GlassPanel strong className="relative p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge tone="success" dot>real-time</Badge>
              <span className="text-[12px] text-white/45">bot.logs</span>
            </div>
            <span className="num text-[11px] text-white/35">14 287 events / 24h</span>
          </div>

          <div className="rounded-ios-sm border border-white/10 bg-black/40 p-4 font-mono text-[12.5px] leading-relaxed">
            {LOGS.map((log, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 140, damping: 22 }}
                className="flex items-center gap-3 py-1.5"
              >
                <span className="num text-white/30">{log.t}</span>
                <span
                  className={
                    "inline-grid h-4 w-4 place-items-center rounded text-[10px] " +
                    (log.tone === "success"
                      ? "bg-emerald-400/15 text-emerald-300"
                      : log.tone === "warning"
                        ? "bg-amber-400/15 text-amber-300"
                        : "bg-white/10 text-white/70")
                  }
                >
                  {log.k}
                </span>
                <span className="text-white/85">{log.text}</span>
              </motion.div>
            ))}
            {/* shimmer line */}
            <div className="relative mt-2 h-px overflow-hidden bg-white/5">
              <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <Mini label="FunPay" value="online" tone="success" />
            <Mini label="Starvell" value="online" tone="success" />
            <Mini label="Playerok" value="syncing" tone="warning" />
          </div>
        </GlassPanel>
      </div>
    </section>
  );
}

function Mini({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "success" | "warning";
}) {
  return (
    <div className="rounded-ios-sm border border-white/10 bg-white/[0.04] py-3">
      <div className="text-[10.5px] uppercase tracking-wider text-white/40">{label}</div>
      <div
        className={
          "num mt-1 text-[13px] " +
          (tone === "success" ? "text-emerald-300" : "text-amber-300")
        }
      >
        {value}
      </div>
    </div>
  );
}
