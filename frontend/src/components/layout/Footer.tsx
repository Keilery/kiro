import Link from "next/link";

const COLS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Платформа",
    links: [
      { href: "/marketplace", label: "Маркет" },
      { href: "/shop", label: "Магазин" },
      { href: "/rental", label: "Аренда" },
      { href: "/automation", label: "Автоматизация" }
    ]
  },
  {
    title: "Аккаунт",
    links: [
      { href: "/profile", label: "Профиль" },
      { href: "/profile/wallet", label: "Кошелёк" },
      { href: "/profile/referrals", label: "Рефералы" },
      { href: "/profile/api", label: "API-ключи" }
    ]
  },
  {
    title: "Поддержка",
    links: [
      { href: "/support", label: "Тикеты" },
      { href: "/support/faq", label: "FAQ" },
      { href: "/support/status", label: "Статус сервисов" },
      { href: "/support/changelog", label: "Changelog" }
    ]
  },
  {
    title: "Разработчикам",
    links: [
      { href: "/api/docs", label: "API Docs" },
      { href: "/api/sandbox", label: "Sandbox" },
      { href: "/api/sdk", label: "SDK" },
      { href: "/api/webhooks", label: "Webhooks" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/[0.06] px-6 py-16">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-y-10 sm:grid-cols-4 md:grid-cols-5">
        <div className="col-span-2 sm:col-span-4 md:col-span-1">
          <div className="text-lg font-semibold tracking-tight">NexusMarket</div>
          <p className="mt-2 max-w-[28ch] text-[13px] leading-relaxed text-white/45">
            Игровая экономика нового поколения.
            552 функции, эскроу, автоматизация.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <div className="eyebrow mb-4">{c.title}</div>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-[13.5px] text-white/65 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="hairline mt-12" />
      <div className="mx-auto mt-6 flex max-w-[1400px] flex-col items-start justify-between gap-3 text-[12px] text-white/35 sm:flex-row sm:items-center">
        <div>© {new Date().getFullYear()} NexusMarket. Все права защищены.</div>
        <div className="flex gap-5">
          <Link href="/legal/terms" className="hover:text-white/70">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-white/70">Privacy</Link>
          <Link href="/legal/cookies" className="hover:text-white/70">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
