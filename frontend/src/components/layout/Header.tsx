"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/marketplace", label: "Маркет" },
  { href: "/shop", label: "Магазин" },
  { href: "/rental", label: "Аренда" },
  { href: "/automation", label: "Авто" },
  { href: "/support", label: "Поддержка" }
];

export function Header() {
  const { scrollY } = useScroll();
  // header tightens & gets stronger glass on scroll — production polish (Jakub)
  const backdropFilter = useTransform(
    scrollY,
    [0, 200],
    ["blur(16px) saturate(140%)", "blur(40px) saturate(160%)"]
  );
  const bg = useTransform(scrollY, [0, 200], ["rgba(255,255,255,0.02)", "rgba(255,255,255,0.06)"]);
  const border = useTransform(
    scrollY,
    [0, 200],
    ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.14)"]
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <motion.nav
        style={{ background: bg, borderColor: border, backdropFilter, WebkitBackdropFilter: backdropFilter }}
        className={cn(
          "mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 rounded-full border px-3 sm:px-5",
          "backdrop-blur-liquid"
        )}
      >
        <Link href="/" className="flex items-center gap-2 pl-1">
          <Logo />
          <span className="hidden text-[15px] font-semibold tracking-tight sm:inline">
            NexusMarket
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link
                href={n.href}
                className="rounded-full px-3.5 py-2 text-[13.5px] text-white/70 transition-colors duration-300 ease-out-expo hover:bg-white/5 hover:text-white"
              >
                {n.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <IconBtn aria-label="Поиск">
            <Search className="h-4 w-4" strokeWidth={1.6} />
          </IconBtn>
          <IconBtn aria-label="Корзина">
            <ShoppingBag className="h-4 w-4" strokeWidth={1.6} />
          </IconBtn>
          <Link
            href="/profile"
            className="ml-1 inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-[13px] font-medium text-black transition-transform duration-300 ease-out-expo active:scale-[0.97]"
          >
            <User className="h-3.5 w-3.5" strokeWidth={2} />
            <span>Войти</span>
          </Link>
        </div>
      </motion.nav>
    </header>
  );
}

function IconBtn({ children, ...rest }: React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className="grid h-9 w-9 place-items-center rounded-full text-white/75 transition-colors duration-300 ease-out-expo hover:bg-white/10 hover:text-white"
    >
      {children}
    </button>
  );
}

function Logo() {
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 place-items-center rounded-xl bg-white text-black"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2 12V2L12 12V2"
          stroke="black"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
