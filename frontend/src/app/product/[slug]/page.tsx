"use client";

import { useState } from "react";
import { Star, ShieldCheck, Zap, MessageSquare, Clock, MapPin, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { OrbitCard } from "@/components/ui/OrbitCard";
import { SpaceButton } from "@/components/ui/SpaceButton";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { products, productReviews } from "@/lib/mock-data";
import { formatPrice, formatNumber } from "@/lib/format";
import { notFound } from "next/navigation";

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) return notFound();

  return (
    <section className="relative pt-28 pb-20">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-7 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-space-dust">
          <Link href="/catalog" className="hover:text-space-lunar">
            Каталог
          </Link>
          <span>/</span>
          <Link
            href={`/catalog?game=${product.game.toLowerCase()}`}
            className="hover:text-space-lunar"
          >
            {product.game}
          </Link>
          <span>/</span>
          <span className="text-space-lunar">{product.category}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          {/* Left — gallery + description */}
          <div className="space-y-8">
            <ProductGallery title={product.game} />

            <ProductDescription product={product} />

            <ReviewsBlock />
          </div>

          {/* Right — buy + seller */}
          <div className="space-y-4">
            <PurchaseCard product={product} />
            <SellerCard product={product} />
            <SecurityNotice />
          </div>
        </div>

        {/* Similar */}
        <section className="mt-24">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
                // 08 · ai рекомендации
              </div>
              <h2 className="mt-4 font-display text-[28px] font-medium tracking-tight text-space-white">
                Похожие лоты в той же орбите
              </h2>
            </div>
            <Link
              href="/catalog"
              className="font-mono text-[12px] uppercase tracking-[0.18em] text-space-lunar hover:text-space-white"
            >
              Все →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {products
              .filter((p) => p.id !== product.id)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function ProductGallery({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/9] overflow-hidden rounded-orbit border border-white/[0.07] bg-space-deep/60">
        <div className="absolute inset-0 cosmic-grid-fine opacity-50" />
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="relative">
            <div className="absolute -inset-24 animate-orbit-slow rounded-full border border-white/[0.04]" />
            <div className="absolute -inset-16 animate-orbit-reverse rounded-full border border-white/[0.06]" />
            <div className="absolute -inset-9 rounded-full border border-white/[0.08]" />
            <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-white/15 bg-space-black/70 backdrop-blur-md shadow-halo-strong">
              <span className="font-display text-[18px] font-semibold tracking-[0.18em]">
                {title.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="absolute left-4 top-4">
          <Badge dot variant="success">Live · 312 просмотров</Badge>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            className="relative aspect-square overflow-hidden rounded-orbit-sm border border-white/[0.07] bg-space-deep/60 transition-all hover:border-white/25"
          >
            <div className="absolute inset-0 cosmic-grid-fine opacity-40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-white/[0.04]" />
            </div>
            {i === 0 && <div className="absolute inset-0 border border-space-white/40" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductDescription({ product }: { product: typeof products[0] }) {
  return (
    <OrbitCard className="p-8">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
        // описание лота
      </h2>
      <h1 className="mt-3 font-display text-[28px] font-medium leading-tight tracking-tight text-space-white">
        {product.title}
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-y-3 border-y border-white/[0.05] py-5 md:grid-cols-3">
        {[
          { k: "Игра", v: product.game },
          { k: "Тип", v: "Аккаунт" },
          { k: "Регион", v: product.region },
          { k: "Выдача", v: product.delivery === "AUTO" ? "Авто (9 сек)" : "Ручная" },
          { k: "В наличии", v: "12 шт" },
          { k: "Гарантия", v: "30 дней" }
        ].map((s) => (
          <div key={s.k}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
              {s.k}
            </div>
            <div className="mt-1 text-[13.5px] text-space-lunar">{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3 text-[14.5px] leading-relaxed text-space-lunar/85">
        <p>
          Полностью прокачанный аккаунт с Prime-статусом, играным с лаунча CS:GO.
          Linked-почта переоформляется на покупателя в течение 30 минут после
          подтверждения сделки.
        </p>
        <p>
          В комплекте: 41 кейс, медаль ветерана, FACEIT-аккаунт с уровнем 9
          (2200 elo), полная история банов — чистая. Гарантия 30 дней —
          возврат по правилам KOCMOC.
        </p>
        <ul className="mt-3 space-y-2 border-t border-white/[0.05] pt-4">
          {[
            "Linked email + восстановительные ключи",
            "Прошёл Prime-апгрейд от Steam",
            "FACEIT премиум до 2026 года",
            "Без VAC, Overwatch, Trade и Community banов"
          ].map((bp) => (
            <li key={bp} className="flex items-start gap-2.5 text-[13.5px] text-space-lunar/80">
              <span className="mt-2 block h-1 w-1 shrink-0 rounded-full bg-space-white" />
              {bp}
            </li>
          ))}
        </ul>
      </div>
    </OrbitCard>
  );
}

function PurchaseCard({ product }: { product: typeof products[0] }) {
  const [qty, setQty] = useState(1);
  return (
    <OrbitCard glow inset className="p-7">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
            цена за лот
          </div>
          <div className="mt-2 font-display text-[44px] font-medium leading-none tracking-tight text-space-white tabular">
            {formatPrice(product.price, product.currency)}
          </div>
          <div className="mt-1 font-mono text-[11.5px] text-space-dust">
            ≈ $169 · €151 · 165₮ USDT
          </div>
        </div>
        {product.badges?.includes("hot") && (
          <Badge variant="warning">Хит недели</Badge>
        )}
      </div>

      {/* Quantity */}
      <div className="mt-6 flex items-center gap-2 border-y border-white/[0.06] py-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-space-dust">
          кол-во
        </span>
        <div className="ml-auto flex items-center rounded-full border border-white/10 bg-white/[0.025]">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="flex h-8 w-8 items-center justify-center text-space-lunar transition-colors hover:bg-white/[0.06]"
          >
            −
          </button>
          <span className="w-10 text-center font-mono text-[14px] text-space-white tabular">
            {qty}
          </span>
          <button
            onClick={() => setQty(qty + 1)}
            className="flex h-8 w-8 items-center justify-center text-space-lunar transition-colors hover:bg-white/[0.06]"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-b border-white/[0.06] pb-5 text-[13.5px]">
        <span className="text-space-lunar">Комиссия эскроу</span>
        <span className="font-mono text-space-lunar tabular">4.5%</span>
      </div>
      <div className="mt-4 flex items-center justify-between text-[13.5px]">
        <span className="text-space-lunar">К оплате</span>
        <span className="font-mono text-[18px] font-medium text-space-white tabular">
          {formatPrice(Math.round(product.price * qty * 1.045), product.currency)}
        </span>
      </div>

      <div className="mt-7 space-y-2">
        <SpaceButton fullWidth size="lg" iconRight={<ArrowUpRight className="h-4 w-4" />}>
          Купить с эскроу
        </SpaceButton>
        <SpaceButton fullWidth variant="secondary" iconLeft={<MessageSquare className="h-4 w-4" />}>
          Спросить продавца
        </SpaceButton>
      </div>

      <div className="mt-6 flex items-center gap-4 border-t border-white/[0.06] pt-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
        <span className="flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-space-lunar" /> авто-выдача
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-nova-green" /> escrow
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-space-lunar" /> 9 сек
        </span>
      </div>
    </OrbitCard>
  );
}

function SellerCard({ product }: { product: typeof products[0] }) {
  return (
    <OrbitCard className="p-6">
      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
        // продавец
      </div>
      <div className="mt-4 flex items-start gap-4">
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.05] font-mono text-[16px] text-space-white">
            {product.sellerName.slice(0, 2).toUpperCase()}
          </div>
          {product.online && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-nova-green ring-2 ring-space-deep" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-display text-[17px] font-medium text-space-white">
              {product.sellerName}
            </div>
            {product.sellerKyc && (
              <Badge variant="success" icon={<ShieldCheck className="h-3 w-3" />}>KYC</Badge>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[12.5px] text-space-lunar/80">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-space-white" />
              {product.sellerRating}
            </span>
            <span>·</span>
            <span>{formatNumber(product.sellerSales)} сделок</span>
            {product.online && (
              <>
                <span>·</span>
                <span className="text-nova-green">онлайн</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-5">
        {[
          { k: "Сделок", v: formatNumber(product.sellerSales) },
          { k: "Откликается", v: "<2 мин" },
          { k: "С нами", v: "8 мес" }
        ].map((s) => (
          <div key={s.k}>
            <div className="font-display text-[18px] font-medium text-space-white tabular">
              {s.v}
            </div>
            <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-space-dust">
              {s.k}
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/dashboard"
        className="mt-5 inline-flex items-center gap-1.5 text-[12.5px] text-space-lunar hover:text-space-white"
      >
        Профиль продавца
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </OrbitCard>
  );
}

function SecurityNotice() {
  return (
    <div className="rounded-orbit border border-nova-green/15 bg-nova-green/[0.04] p-5">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-nova-green" />
        <div>
          <div className="font-display text-[13.5px] font-medium text-space-white">
            Эскроу-зона активна
          </div>
          <div className="mt-1 text-[12.5px] leading-relaxed text-space-lunar/75">
            Деньги замораживаются и переводятся продавцу только после твоего
            подтверждения. Если что-то пойдёт не так — открой спор за 30 секунд.
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewsBlock() {
  return (
    <OrbitCard className="p-7">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
            // отзывы покупателей
          </div>
          <h3 className="mt-3 font-display text-[22px] font-medium tracking-tight text-space-white">
            4.97 / 5 · 1 842 отзыва
          </h3>
        </div>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="h-4 w-4 fill-current text-space-white" />
          ))}
        </div>
      </div>

      {/* Гистограмма */}
      <div className="mt-6 grid grid-cols-5 gap-1.5">
        {[97, 2.4, 0.5, 0.1, 0].map((pct, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="relative h-12 w-full overflow-hidden rounded bg-white/[0.04]">
              <div
                className="absolute bottom-0 left-0 right-0 bg-space-white/80"
                style={{ height: `${pct}%` }}
              />
            </div>
            <div className="font-mono text-[10.5px] tabular text-space-dust">
              {5 - i}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 space-y-5 border-t border-white/[0.06] pt-7">
        {productReviews.map((r) => (
          <div key={r.author} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] font-mono text-[11px] text-space-white">
                  {r.author.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[13px] text-space-white">
                    {r.author}
                    {r.verified && <ShieldCheck className="h-3 w-3 text-nova-green" />}
                  </div>
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
                    {r.date}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: r.rating }, (_, i) => (
                  <Star key={i} className="h-3 w-3 fill-current text-space-white" />
                ))}
              </div>
            </div>
            <p className="text-[13.5px] leading-relaxed text-space-lunar/85">
              {r.body}
            </p>
          </div>
        ))}
      </div>
    </OrbitCard>
  );
}
