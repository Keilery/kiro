"use client";

import {
  Shield,
  Lock,
  ScanFace,
  Scale,
  KeySquare,
  Eye,
  Cpu,
  ServerCog,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { OrbitCard } from "@/components/ui/OrbitCard";
import { SpaceButton } from "@/components/ui/SpaceButton";
import { GravityScroll } from "@/components/cosmic/GravityScroll";

const protections = [
  {
    icon: KeySquare,
    title: "Эскроу-зона",
    spec: "T+0 hold · 256-bit",
    body:
      "Деньги покупателя замораживаются в момент оплаты. Продавец получает их только после твоего подтверждения. Платформа физически не имеет доступа к замороженным средствам — они лежат на сегрегированном счёте."
  },
  {
    icon: ScanFace,
    title: "KYC-верификация",
    spec: "ID + selfie · 24h SLA",
    body:
      "Продавцы с оборотом от $500/мес проходят проверку документов. Бейдж KYC отображается в карточке лота. AI-модель ловит подделки, человеческие модераторы валидируют сомнительные кейсы."
  },
  {
    icon: Shield,
    title: "Анти-фрод",
    spec: "ML · v3.2 · realtime",
    body:
      "Поведенческая модель оценивает каждую сделку: IP-репутация, fingerprint устройства, история кошельков. Подозрительные ордера ставятся на ручную модерацию за 4 секунды до отправки."
  },
  {
    icon: Lock,
    title: "Шифрование",
    spec: "AES-256 · TLS 1.3",
    body:
      "Данные авто-выдачи зашифрованы на стороне сервера, расшифровываются только в момент успешной сделки. Пароли — bcrypt 12 rounds. Никто из команды KOCMOC не имеет к ним доступа."
  },
  {
    icon: Cpu,
    title: "2FA + WebAuthn",
    spec: "TOTP · YubiKey · Passkeys",
    body:
      "Двухфакторная аутентификация через Google Authenticator, Authy или аппаратные ключи (YubiKey, Passkeys). Обязательна для KYC-продавцов и админ-доступа."
  },
  {
    icon: Eye,
    title: "Аудит-логи",
    spec: "Append-only · 90 дней",
    body:
      "Каждое действие админов и важные системные события пишутся в append-only лог. Логи доступны в твоём личном кабинете — ты можешь видеть, кто и когда смотрел твой профиль."
  },
  {
    icon: ServerCog,
    title: "Инфраструктура",
    spec: "ISO 27001 · GDPR-ready",
    body:
      "База с шифрованием at-rest, ежедневные снапшоты в трёх ДЦ. Helmet headers, CSP, SRI, регулярные пентесты по OWASP Top 10. RPO/RTO < 1 час."
  },
  {
    icon: Scale,
    title: "Споры и арбитраж",
    spec: "6 мин avg · 99.4% sat",
    body:
      "Открытие спора занимает 30 секунд. Чат сделки полностью сохраняется и доступен модераторам. Среднее время решения — 6 минут. Решение арбитража исполняется автоматически (refund / release)."
  }
];

const owasp = [
  { code: "A01:2021", name: "Broken Access Control", status: "Guards на каждом endpoint, проверка владельца ресурса" },
  { code: "A02:2021", name: "Cryptographic Failures", status: "bcrypt + AES-256, секреты в Vault, никогда в коде" },
  { code: "A03:2021", name: "Injection", status: "Prisma ORM, parameterized queries, DOMPurify для UGC" },
  { code: "A04:2021", name: "Insecure Design", status: "Threat modeling на каждой фиче, security review до merge" },
  { code: "A05:2021", name: "Security Misconfig", status: "Helmet headers, CSP strict, immutable infra (IaC)" },
  { code: "A06:2021", name: "Vulnerable Components", status: "Snyk + dependabot, weekly cron сканы" },
  { code: "A07:2021", name: "Auth Failures", status: "JWT + refresh, rate limit, 2FA, session management" },
  { code: "A08:2021", name: "Data Integrity", status: "Subresource Integrity (SRI), signed commits, audit log" },
  { code: "A09:2021", name: "Logging Failures", status: "Winston + Loki, alerts на аномалии, retain 90д" },
  { code: "A10:2021", name: "SSRF", status: "Allow-list для outbound, validation схем URL" }
];

export default function SecurityPage() {
  return (
    <section className="relative pt-28 pb-20">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        {/* Hero */}
        <div className="mb-20 grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
              // безопасность kocmoc
            </div>
            <h1 className="mt-5 headline-mega text-[clamp(48px,6.5vw,108px)] text-space-white">
              Защита,
              <br />
              <span className="text-space-white/40">встроенная</span>
              <br />
              в орбиту.
            </h1>
            <p className="mt-7 max-w-[560px] text-[16px] leading-relaxed text-space-lunar/80">
              Эскроу-холд, KYC-верификация, ML-антифрод и сегрегированные счета —
              восемь слоёв защиты для каждой сделки. Кратко и без маркетинга:
              что именно мы делаем, как, зачем.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/auth/register">
                <SpaceButton iconRight={<ArrowUpRight className="h-4 w-4" />}>
                  Защищённая сделка
                </SpaceButton>
              </Link>
              <Link href="/catalog">
                <SpaceButton variant="secondary">Смотреть каталог</SpaceButton>
              </Link>
            </div>
          </div>

          <OrbitCard glow inset className="relative overflow-hidden p-8">
            <div
              aria-hidden
              className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/[0.05] animate-orbit-slow"
            />
            <div
              aria-hidden
              className="absolute -right-12 -top-12 h-44 w-44 rounded-full border border-white/[0.07] animate-orbit-reverse"
            />
            <div className="relative">
              <Badge dot variant="success">live · ноль активных инцидентов</Badge>
              <div className="mt-5 space-y-4">
                {[
                  { k: "Споров / GMV", v: "0.01%" },
                  { k: "Среднее решение спора", v: "6 мин" },
                  { k: "Возврат при споре в пользу покупателя", v: "100%" },
                  { k: "Uptime за 30 дней", v: "99.97%" }
                ].map((s) => (
                  <div key={s.k} className="flex items-baseline justify-between border-b border-white/[0.05] pb-2">
                    <span className="text-[13px] text-space-lunar/80">{s.k}</span>
                    <span className="font-mono text-[15px] font-medium text-space-white tabular">
                      {s.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </OrbitCard>
        </div>

        {/* Слои защиты */}
        <GravityScroll className="mb-14">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
            // 8 слоёв защиты
          </div>
          <h2 className="mt-4 headline-hero text-[clamp(32px,4vw,56px)] text-space-white">
            Каждая орбита — закрытая
          </h2>
        </GravityScroll>

        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
          {protections.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <OrbitCard interactive glow className="relative h-full overflow-hidden p-7">
                <div
                  aria-hidden
                  className="absolute -bottom-12 -right-12 h-36 w-36 rounded-full border border-white/[0.06]"
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                      <p.icon className="h-5 w-5 text-space-lunar" strokeWidth={1.4} />
                    </div>
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-[19px] font-medium tracking-tight text-space-white">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-space-lunar/80">
                    {p.body}
                  </p>
                  <div className="mt-5 inline-flex items-center gap-2 border-t border-white/[0.06] pt-3 font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                    <span className="block h-px w-4 bg-white/30" />
                    {p.spec}
                  </div>
                </div>
              </OrbitCard>
            </motion.div>
          ))}
        </div>

        {/* OWASP Top 10 */}
        <section id="fraud" className="mt-32">
          <div className="mb-10 flex items-end justify-between border-b border-white/[0.07] pb-8">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
                // owasp top 10
              </div>
              <h2 className="mt-3 headline-hero text-[clamp(28px,3.5vw,44px)] text-space-white">
                Что мы делаем со всем списком OWASP
              </h2>
            </div>
            <Badge variant="success">10 / 10 покрыто</Badge>
          </div>
          <div className="overflow-hidden rounded-orbit border border-white/[0.07] bg-space-deep/40">
            <div className="hidden border-b border-white/[0.06] px-6 py-3 font-mono text-[10.5px] uppercase tracking-[0.2em] text-space-dust md:grid md:grid-cols-[110px_1fr_2fr]">
              <span>код</span>
              <span>уязвимость</span>
              <span>защита kocmoc</span>
            </div>
            {owasp.map((o, i) => (
              <div
                key={o.code}
                className="grid grid-cols-1 gap-2 border-b border-white/[0.04] px-6 py-4 transition-colors last:border-b-0 hover:bg-white/[0.02] md:grid-cols-[110px_1fr_2fr] md:items-center md:gap-4"
              >
                <span className="font-mono text-[11px] text-space-dust tabular">{o.code}</span>
                <span className="font-display text-[14px] font-medium text-space-white">
                  {o.name}
                </span>
                <span className="text-[12.5px] leading-relaxed text-space-lunar/80">
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
