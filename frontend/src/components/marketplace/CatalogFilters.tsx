"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Check, X } from "lucide-react";
import { CosmicInput } from "@/components/ui/CosmicInput";
import { games } from "@/lib/mock-data";

const types = [
  { key: "accounts", name: "Аккаунты" },
  { key: "currency", name: "Валюта" },
  { key: "items", name: "Предметы" },
  { key: "services", name: "Услуги" },
  { key: "subscriptions", name: "Подписки" },
  { key: "boost", name: "Бусты" }
];

const regions = ["GLB", "EU", "RU", "US", "ASIA"];
const sorts = [
  { key: "popular", name: "По популярности" },
  { key: "price_asc", name: "Дешевле" },
  { key: "price_desc", name: "Дороже" },
  { key: "rating", name: "Топ продавцы" },
  { key: "new", name: "Новые" }
];

export function CatalogFilters() {
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeRegions, setActiveRegions] = useState<string[]>([]);
  const [autoOnly, setAutoOnly] = useState(false);
  const [kycOnly, setKycOnly] = useState(false);
  const [sort, setSort] = useState("popular");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const reset = () => {
    setActiveTypes([]);
    setActiveRegions([]);
    setAutoOnly(false);
    setKycOnly(false);
    setSort("popular");
    setPriceMin("");
    setPriceMax("");
  };

  return (
    <aside className="space-y-7">
      {/* Поиск */}
      <CosmicInput
        iconLeft={<Search className="h-4 w-4" />}
        placeholder="Найти лот, игру, продавца…"
        aria-label="Поиск по каталогу"
      />

      {/* Сортировка */}
      <FilterGroup title="Сортировка">
        <div className="space-y-1.5">
          {sorts.map((s) => (
            <label
              key={s.key}
              className="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 transition-colors hover:bg-white/[0.04]"
            >
              <span className="text-[13px] text-space-lunar/85">{s.name}</span>
              <input
                type="radio"
                name="sort"
                checked={sort === s.key}
                onChange={() => setSort(s.key)}
                className="sr-only"
              />
              <span
                className={`h-3.5 w-3.5 rounded-full border transition-all ${
                  sort === s.key
                    ? "border-space-white bg-space-white"
                    : "border-white/20"
                }`}
              />
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Тип */}
      <FilterGroup title="Категория">
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => {
            const on = activeTypes.includes(t.key);
            return (
              <button
                key={t.key}
                onClick={() => toggle(activeTypes, t.key, setActiveTypes)}
                className={`rounded-full border px-3 py-1.5 text-[12px] transition-all ${
                  on
                    ? "border-space-white bg-space-white text-space-black"
                    : "border-white/10 bg-white/[0.025] text-space-lunar hover:border-white/25"
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* Игра */}
      <FilterGroup title="Игра">
        <div className="max-h-[200px] space-y-1 overflow-y-auto pr-1">
          {games.slice(0, 8).map((g) => (
            <label
              key={g.slug}
              className="flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 transition-colors hover:bg-white/[0.04]"
            >
              <span className="text-[13px] text-space-lunar/85">{g.name}</span>
              <span className="font-mono text-[10.5px] tabular text-space-dust">
                {g.lots.toLocaleString("ru-RU")}
              </span>
            </label>
          ))}
        </div>
      </FilterGroup>

      {/* Цена */}
      <FilterGroup title="Цена, ₽">
        <div className="grid grid-cols-2 gap-2">
          <CosmicInput
            type="text"
            inputMode="numeric"
            placeholder="от"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <CosmicInput
            type="text"
            inputMode="numeric"
            placeholder="до"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
      </FilterGroup>

      {/* Регион */}
      <FilterGroup title="Регион">
        <div className="flex flex-wrap gap-1.5">
          {regions.map((r) => {
            const on = activeRegions.includes(r);
            return (
              <button
                key={r}
                onClick={() => toggle(activeRegions, r, setActiveRegions)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider transition-all ${
                  on
                    ? "border-space-white bg-space-white text-space-black"
                    : "border-white/10 bg-white/[0.025] text-space-dust hover:border-white/25 hover:text-space-lunar"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      {/* Toggles */}
      <FilterGroup title="Параметры сделки">
        <div className="space-y-2">
          <Toggle label="Только авто-выдача" on={autoOnly} set={setAutoOnly} />
          <Toggle label="Только KYC-продавцы" on={kycOnly} set={setKycOnly} />
        </div>
      </FilterGroup>

      <button
        onClick={reset}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-space-dust transition-colors hover:text-space-white"
      >
        <X className="h-3 w-3" /> Сбросить фильтры
      </button>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.2em] text-space-dust">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (b: boolean) => void }) {
  return (
    <button
      onClick={() => set(!on)}
      className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
    >
      <span className="text-[13px] text-space-lunar/85">{label}</span>
      <div
        className={`relative h-5 w-9 rounded-full border transition-all ${
          on ? "border-space-white bg-space-white" : "border-white/15 bg-white/[0.03]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all ${
            on ? "left-[18px] bg-space-black" : "left-0.5 bg-space-lunar"
          }`}
        />
      </div>
    </button>
  );
}
