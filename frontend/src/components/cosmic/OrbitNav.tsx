"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gamepad2, ShoppingBag, Sparkles, Headphones, MessageCircle, Briefcase, Tv2, Coins } from "lucide-react";
import Link from "next/link";

type OrbitItem = {
  name: string;
  href: string;
  icon: typeof Gamepad2;
  count: string;
};

const items: OrbitItem[] = [
  { name: "Игры", href: "/catalog?type=games", icon: Gamepad2, count: "12 478" },
  { name: "Валюта", href: "/catalog?type=currency", icon: Coins, count: "8 921" },
  { name: "Подписки", href: "/catalog?type=subs", icon: Tv2, count: "3 401" },
  { name: "Услуги", href: "/catalog?type=services", icon: Briefcase, count: "5 224" },
  { name: "Соцсети", href: "/catalog?type=social", icon: MessageCircle, count: "2 113" },
  { name: "Бусты", href: "/catalog?type=boost", icon: Sparkles, count: "1 887" },
  { name: "Аккаунты", href: "/catalog?type=accounts", icon: ShoppingBag, count: "14 902" },
  { name: "Саппорт", href: "/catalog?type=support", icon: Headphones, count: "612" }
];

/**
 * OrbitNav — категории, расположенные по орбите вокруг планеты.
 * На мобильных схлопывается в сетку.
 */
export function OrbitNav() {
  const reduced = useReducedMotion();

  return (
    <>
      {/* Desktop — орбитальное расположение */}
      <div className="relative hidden lg:block">
        <div className="relative mx-auto aspect-square w-full max-w-[680px]">
          {/* Орбитальные кольца */}
          <div className="orbit-ring inset-[18%]" />
          <div className="orbit-ring inset-[6%] border-dashed opacity-50" />
          {items.map((item, i) => {
            const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2;
            const r = 46; // % от контейнера
            const x = 50 + Math.cos(angle) * r;
            const y = 50 + Math.sin(angle) * r;
            return (
              <motion.div
                key={item.name}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * i + 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={item.href}
                  className="group relative block"
                  aria-label={item.name}
                >
                  <div
                    className="flex h-[88px] w-[88px] flex-col items-center justify-center rounded-full border border-white/10 bg-space-deep/80 backdrop-blur-md transition-all duration-300 ease-warp group-hover:scale-110 group-hover:border-white/40 group-hover:shadow-halo-white"
                  >
                    <item.icon
                      className="h-5 w-5 text-space-lunar transition-colors group-hover:text-space-white"
                      strokeWidth={1.4}
                    />
                    <span className="mt-1.5 font-display text-[11px] font-medium tracking-tight">
                      {item.name}
                    </span>
                  </div>
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-space-dust opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {item.count}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile — сетка */}
      <div className="grid grid-cols-4 gap-3 lg:hidden">
        {items.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group flex aspect-square flex-col items-center justify-center rounded-orbit-sm border border-white/[0.08] bg-white/[0.025] transition-all hover:border-white/20 hover:bg-white/[0.05]"
          >
            <item.icon className="h-4 w-4 text-space-lunar" strokeWidth={1.4} />
            <span className="mt-1.5 text-[11px] font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
