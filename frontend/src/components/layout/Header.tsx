"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/cn";

const nav = [
  { name: "Каталог", href: "/catalog" },
  { name: "Игры", href: "/catalog?type=games" },
  { name: "Услуги", href: "/catalog?type=services" },
  { name: "Безопасность", href: "/security" }
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-warp",
        scrolled
          ? "border-b border-white/[0.07] bg-space-black/80 backdrop-blur-nebula"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="KOCMOC">
          <CosmicLogo />
          <span className="font-display text-[18px] font-medium tracking-[0.18em] text-space-white">
            KOCMOC
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="rounded-full px-4 py-1.5 text-[13.5px] font-medium text-space-lunar/85 transition-colors hover:text-space-white"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            aria-label="Поиск"
            className="flex h-9 w-9 items-center justify-center rounded-full text-space-lunar/70 transition-colors hover:bg-white/[0.05] hover:text-space-white"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <button
            aria-label="Уведомления"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-space-lunar/70 transition-colors hover:bg-white/[0.05] hover:text-space-white"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-nova-green animate-pulse-dot" />
          </button>
          <Link
            href="/dashboard"
            aria-label="Корзина"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-space-lunar/70 transition-colors hover:bg-white/[0.05] hover:text-space-white md:flex"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
          <div className="ml-1 hidden h-6 w-px bg-white/10 md:block" />
          <Link
            href="/auth/login"
            className="hidden h-9 items-center rounded-full px-4 text-[13px] font-medium text-space-lunar/85 transition-colors hover:text-space-white md:inline-flex"
          >
            Войти
          </Link>
          <Link
            href="/auth/register"
            className="ml-1 hidden h-9 items-center rounded-full bg-space-white px-4 text-[13px] font-medium text-space-black transition-all hover:shadow-halo-strong md:inline-flex"
          >
            Регистрация
          </Link>
          <Link
            href="/dashboard"
            aria-label="Профиль"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-space-lunar md:hidden"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function CosmicLogo() {
  return (
    <div className="relative flex h-8 w-8 items-center justify-center">
      <svg
        viewBox="0 0 32 32"
        className="absolute inset-0 h-full w-full animate-orbit-med text-space-white/60"
        aria-hidden
      >
        <ellipse
          cx="16"
          cy="16"
          rx="14"
          ry="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2 3"
        />
      </svg>
      <div className="absolute h-3.5 w-3.5 rounded-full bg-space-white shadow-halo-white" />
      <div
        aria-hidden
        className="absolute h-3.5 w-3.5 rounded-full bg-space-white opacity-30 blur-md"
      />
    </div>
  );
}
