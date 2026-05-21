import Link from "next/link";
import { Github, MessageCircle, Send } from "lucide-react";

const columns = [
  {
    title: "Маркетплейс",
    links: [
      { name: "Каталог", href: "/catalog" },
      { name: "Игровые аккаунты", href: "/catalog?type=accounts" },
      { name: "Подписки", href: "/catalog?type=subs" },
      { name: "Услуги", href: "/catalog?type=services" }
    ]
  },
  {
    title: "Аккаунт",
    links: [
      { name: "Личный кабинет", href: "/dashboard" },
      { name: "Стать продавцом", href: "/dashboard/sell" },
      { name: "Баланс и выплаты", href: "/dashboard/wallet" },
      { name: "Чат и сделки", href: "/chat" }
    ]
  },
  {
    title: "Защита",
    links: [
      { name: "Эскроу-система", href: "/security" },
      { name: "KYC верификация", href: "/security#kyc" },
      { name: "Споры и решения", href: "/security#disputes" },
      { name: "Анти-фрод", href: "/security#fraud" }
    ]
  },
  {
    title: "О платформе",
    links: [
      { name: "Что такое KOCMOC", href: "/about" },
      { name: "Документация API", href: "/docs" },
      { name: "Правила", href: "/terms" },
      { name: "Конфиденциальность", href: "/privacy" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="relative z-10 mt-32 border-t border-white/[0.07] bg-space-black/40 backdrop-blur-md">
      <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="mx-auto max-w-[1400px] px-5 pb-12 pt-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          {/* Бренд */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9">
                <div className="absolute inset-0 rounded-full border border-white/15" />
                <div className="absolute inset-2 rounded-full bg-space-white" />
              </div>
              <span className="font-display text-[20px] font-medium tracking-[0.18em]">
                KOCMOC
              </span>
            </div>
            <p className="mt-5 max-w-[280px] text-[13.5px] leading-relaxed text-space-dust">
              Маркетплейс цифровой вселенной. Сделки без посредников, эскроу-защита и
              мгновенная авто-выдача — со скоростью света.
            </p>

            <div className="mt-7 flex gap-2">
              {[
                { icon: Send, label: "Telegram", href: "#" },
                { icon: MessageCircle, label: "Discord", href: "#" },
                { icon: Github, label: "GitHub", href: "#" }
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-space-lunar transition-all hover:border-white/30 hover:text-space-white hover:shadow-halo-white"
                >
                  <s.icon className="h-4 w-4" strokeWidth={1.5} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-space-dust">
                  {col.title}
                </h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.name}>
                      <Link
                        href={l.href}
                        className="text-[13.5px] text-space-lunar/80 transition-colors hover:text-space-white"
                      >
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/[0.06] pt-7 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-5 text-[12px] text-space-dust">
            <span>© 2026 KOCMOC. Все орбиты защищены.</span>
            <span className="hidden h-3 w-px bg-white/10 sm:block" />
            <Link href="/terms" className="hover:text-space-lunar">
              Условия
            </Link>
            <Link href="/privacy" className="hover:text-space-lunar">
              Конфиденциальность
            </Link>
            <Link href="/cookies" className="hover:text-space-lunar">
              Cookies
            </Link>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-space-dust">
            v0.1.0 · build 41:21:9
          </div>
        </div>
      </div>
    </footer>
  );
}
