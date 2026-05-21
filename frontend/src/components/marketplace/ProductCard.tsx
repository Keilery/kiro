"use client";

import Link from "next/link";
import { Star, Zap, ShieldCheck, Eye, Flame, Tag } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { formatPrice, formatNumber } from "@/lib/format";
import type { Product } from "@/lib/mock-data";

export function ProductCard({ product, variant = "default" }: { product: Product; variant?: "default" | "wide" }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative block overflow-hidden rounded-orbit border border-white/[0.07] bg-space-deep/60 backdrop-blur-md transition-all duration-500 ease-warp hover:-translate-y-0.5 hover:border-white/25 hover:shadow-halo-white"
    >
      {/* Top bar: бейджи + delivery */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {product.badges?.includes("hot") && (
            <Badge variant="warning" icon={<Flame className="h-3 w-3" />}>
              Хит
            </Badge>
          )}
          {product.badges?.includes("new") && (
            <Badge variant="info">Новое</Badge>
          )}
          {product.badges?.includes("discount") && (
            <Badge variant="success" icon={<Tag className="h-3 w-3" />}>
              −18%
            </Badge>
          )}
          {product.delivery === "AUTO" && (
            <Badge icon={<Zap className="h-3 w-3" />}>Авто</Badge>
          )}
        </div>
        <div className="font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
          {product.region}
        </div>
      </div>

      {/* Декоративная зона визуала */}
      <div className="relative aspect-[5/3] overflow-hidden">
        <div className="absolute inset-0 cosmic-grid-fine opacity-50" />
        {/* Концентрические круги с центрированным «логотипом игры» */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="absolute -inset-12 rounded-full border border-white/[0.05]" />
            <div className="absolute -inset-7 rounded-full border border-white/[0.08]" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-space-black/60 backdrop-blur-md transition-transform duration-700 group-hover:scale-110">
              <span className="font-display text-[13px] font-semibold tracking-[0.2em] text-space-white">
                {product.game.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        {/* Sweeping highlight on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100"
        />
      </div>

      {/* Info */}
      <div className="px-4 py-4">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-space-dust">
          {product.game}
        </div>
        <h3 className="mt-1.5 line-clamp-2 font-display text-[15px] font-medium leading-snug tracking-tight text-space-white">
          {product.title}
        </h3>

        {/* Seller */}
        <div className="mt-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] text-space-lunar/80">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.04] font-mono text-[9px] text-space-white">
              {product.sellerName.slice(0, 1)}
            </span>
            <span className="truncate max-w-[100px]">{product.sellerName}</span>
            {product.sellerKyc && (
              <ShieldCheck className="h-3 w-3 text-nova-green" />
            )}
          </div>
          <div className="flex items-center gap-1 font-mono text-[11.5px] tabular text-space-lunar">
            <Star className="h-3 w-3 fill-current text-space-white" />
            {product.sellerRating}
          </div>
        </div>

        {/* Price row */}
        <div className="mt-4 flex items-end justify-between border-t border-white/[0.05] pt-4">
          <div>
            <div className="font-display text-[24px] font-medium leading-none tracking-tight text-space-white tabular">
              {formatPrice(product.price, product.currency)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-space-dust">
              <Eye className="h-3 w-3" />
              {formatNumber(product.views)} просм.
            </div>
          </div>
          <div className="rounded-full bg-white/[0.05] px-3 py-1 font-mono text-[10.5px] uppercase tracking-wider text-space-lunar transition-colors group-hover:bg-space-white group-hover:text-space-black">
            купить
          </div>
        </div>
      </div>
    </Link>
  );
}
