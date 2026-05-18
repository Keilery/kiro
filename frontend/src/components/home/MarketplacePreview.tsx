"use client";

import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Stripes } from "@/components/ui/Stripes";

const ITEMS = [
  {
    game: "Genshin Impact",
    title: "AR60 · 5x 5★ + Raiden C2",
    price: "₽ 18 400",
    seller: "voltage_eu",
    rating: 4.97,
    online: true
  },
  {
    game: "Steam · CS2",
    title: "Karambit | Doppler (FN)",
    price: "₽ 142 700",
    seller: "skin.lab",
    rating: 5.0,
    online: true
  },
  {
    game: "World of Warcraft",
    title: "Boost 70→80 · 24h",
    price: "₽ 4 290",
    seller: "tideguild",
    rating: 4.92,
    online: false
  },
  {
    game: "Valorant",
    title: "Immortal · 27 skins",
    price: "₽ 9 850",
    seller: "kira.shop",
    rating: 4.88,
    online: true
  }
];

export function MarketplacePreview() {
  return (
    <section className="relative overflow-hidden px-6 py-32">
      <Stripes fine />
      <div className="relative mx-auto max-w-[1400px]">
        <div className="mb-12 grid grid-cols-1 items-end gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <div className="eyebrow mb-3">Маркетплейс · live</div>
            <h2 className="display text-[clamp(36px,5vw,64px)] text-white">
              Торговля без посредников.
              <br />
              <span className="text-white/45">Эскроу — за 3 секунды.</span>
            </h2>
          </div>
          <p className="max-w-md text-[14.5px] leading-relaxed text-white/55">
            Аккаунты, ключи, валюта, услуги, скины. Гарант-сервис, диспуты,
            мгновенная авто-доставка кодов.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                type: "spring",
                stiffness: 110,
                damping: 22,
                delay: i * 0.07
              }}
            >
              <GlassPanel className="group flex h-full flex-col p-5 transition-all duration-500 ease-out-expo hover:bg-white/[0.09]">
                {/* image area */}
                <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-ios-sm border border-white/10 bg-white/[0.04]">
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-60"
                    style={{
                      background:
                        "radial-gradient(70% 60% at 30% 30%, rgba(255,255,255,0.16), transparent 60%), radial-gradient(60% 50% at 80% 70%, rgba(48,209,88,0.10), transparent 60%)"
                    }}
                  />
                  <div className="absolute left-3 top-3">
                    <Badge tone={item.online ? "success" : "neutral"} dot={item.online}>
                      {item.online ? "online" : "offline"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 text-[11px] uppercase tracking-wider text-white/55">
                    {item.game}
                  </div>
                </div>

                <h3 className="text-[15px] font-medium leading-snug text-white">
                  {item.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[12px] text-white/50">
                  <span>{item.seller}</span>
                  <span className="text-white/25">·</span>
                  <span className="num">★ {item.rating.toFixed(2)}</span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-5">
                  <span className="num text-[18px] font-semibold text-white">
                    {item.price}
                  </span>
                  <span className="rounded-full border border-white/15 px-3 py-1.5 text-[11.5px] text-white/80 transition-colors group-hover:border-white/40 group-hover:bg-white group-hover:text-black">
                    Купить
                  </span>
                </div>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
