import { Sparkles, SlidersHorizontal } from "lucide-react";
import { CatalogFilters } from "@/components/marketplace/CatalogFilters";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { products } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";

export default function CatalogPage() {
  return (
    <section className="relative pt-32 pb-20">
      <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
        {/* Header */}
        <header className="mb-12 flex flex-col gap-6 border-b border-white/[0.07] pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-space-dust">
              // каталог · все системы
            </div>
            <h1 className="mt-4 headline-hero text-[clamp(36px,5vw,68px)] text-space-white">
              Найди свою орбиту
            </h1>
            <p className="mt-4 max-w-[520px] text-[15px] text-space-lunar/75">
              {products.length.toLocaleString("ru-RU")} активных лотов · 89 231
              всего · обновляются раз в минуту.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge dot variant="success">Live · 4 122 сделки сегодня</Badge>
            <Badge variant="info" icon={<Sparkles className="h-3 w-3" />}>
              AI рекомендации
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr] lg:gap-14">
          {/* Filters */}
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-2">
            <CatalogFilters />
          </div>

          {/* Grid */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div className="font-mono text-[11.5px] uppercase tracking-[0.18em] text-space-dust">
                Найдено · {products.length} · стр. 1 / 142
              </div>
              <button
                aria-label="Фильтры"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 text-[12.5px] text-space-lunar transition-colors hover:border-white/25 lg:hidden"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Фильтры
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-1.5 border-t border-white/[0.06] pt-8">
              {[1, 2, 3, "…", 141, 142].map((n, i) => (
                <button
                  key={i}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-full border px-3 font-mono text-[12px] tabular transition-all ${
                    n === 1
                      ? "border-space-white bg-space-white text-space-black"
                      : "border-white/10 bg-white/[0.025] text-space-lunar hover:border-white/25"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
