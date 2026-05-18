"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Game, ListingType, Platform } from "@/lib/types";

/**
 * Filter panel for the marketplace grid.
 *
 * State management contract:
 *   - The page owns the canonical filters object.
 *   - This component is *fully controlled*: it reads `value` and emits
 *     `onChange(next)` for every interaction.
 *   - Search input is the only locally-buffered field; we debounce
 *     the upward propagation by 300ms so the page doesn't refetch on
 *     every keystroke. Selection of game/type/platform is propagated
 *     immediately because those are clicks, not typing.
 *
 * UX choices:
 *   - Visible Reset chip when any filter is active. Plan A §1 #4
 *     ("price slider") gets a deferred treatment — for v1 we expose
 *     two number inputs with min/max validation; a real range slider
 *     lands when we can afford the dependency budget.
 *   - Game options are passed in (the parent fetches /catalog/games
 *     once and reuses it). Avoids each filter mount hammering the API.
 */

export interface MarketplaceFilters {
  q?: string;
  gameSlug?: string;
  type?: ListingType;
  platform?: Platform;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
}

const TYPE_OPTIONS: { value: ListingType; label: string }[] = [
  { value: "ACCOUNT", label: "Аккаунты" },
  { value: "KEY", label: "Ключи" },
  { value: "ITEM", label: "Предметы" },
  { value: "CURRENCY", label: "Валюта" },
  { value: "SERVICE", label: "Услуги" },
  { value: "BOOST", label: "Прокачка" },
];

const PLATFORM_OPTIONS: { value: Platform; label: string }[] = [
  { value: "PC", label: "PC" },
  { value: "PLAYSTATION", label: "PlayStation" },
  { value: "XBOX", label: "Xbox" },
  { value: "MOBILE", label: "Mobile" },
  { value: "NINTENDO", label: "Nintendo" },
];

export function FilterPanel({
  value,
  games,
  onChange,
  onReset,
}: {
  value: MarketplaceFilters;
  games: Game[];
  onChange: (next: MarketplaceFilters) => void;
  onReset: () => void;
}) {
  // Local search buffer with debounce. Initialized from `value.q` so a
  // page reload with `?q=...` shows the right text in the input.
  const [searchDraft, setSearchDraft] = useState(value.q ?? "");
  useEffect(() => {
    setSearchDraft(value.q ?? "");
  }, [value.q]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      // Only emit if the buffered value actually differs from what the
      // parent already has — avoids an extra refetch when someone types
      // and then deletes a character within the debounce window.
      if ((value.q ?? "") !== searchDraft) {
        onChange({ ...value, q: searchDraft || undefined });
      }
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDraft]);

  const hasAny = Boolean(
    value.q ||
      value.gameSlug ||
      value.type ||
      value.platform ||
      value.priceMin != null ||
      value.priceMax != null ||
      value.ratingMin != null,
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Search ─────────────────────────────────────────────── */}
      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
          strokeWidth={1.6}
          aria-hidden
        />
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Поиск по названию"
          className="h-11 w-full rounded-full border border-white/[0.09] bg-white/[0.025] pl-11 pr-10 text-[14px] text-white placeholder-white/40 outline-none transition-colors focus-visible:border-white/30"
        />
        {searchDraft.length > 0 && (
          <button
            type="button"
            onClick={() => setSearchDraft("")}
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Очистить поиск"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.6} />
          </button>
        )}
      </label>

      {/* Game ────────────────────────────────────────────────── */}
      <FilterGroup label="Игра">
        <ChipScroller>
          <Chip
            active={!value.gameSlug}
            onClick={() => onChange({ ...value, gameSlug: undefined })}
          >
            Все игры
          </Chip>
          {games.map((g) => (
            <Chip
              key={g.id}
              active={value.gameSlug === g.slug}
              onClick={() =>
                onChange({
                  ...value,
                  gameSlug: value.gameSlug === g.slug ? undefined : g.slug,
                })
              }
            >
              {g.title}
            </Chip>
          ))}
        </ChipScroller>
      </FilterGroup>

      {/* Type + Platform on one row at md+ */}
      <div className="grid gap-5 md:grid-cols-2">
        <FilterGroup label="Тип">
          <ChipScroller>
            {TYPE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                active={value.type === opt.value}
                onClick={() =>
                  onChange({
                    ...value,
                    type: value.type === opt.value ? undefined : opt.value,
                  })
                }
              >
                {opt.label}
              </Chip>
            ))}
          </ChipScroller>
        </FilterGroup>

        <FilterGroup label="Платформа">
          <ChipScroller>
            {PLATFORM_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                active={value.platform === opt.value}
                onClick={() =>
                  onChange({
                    ...value,
                    platform: value.platform === opt.value ? undefined : opt.value,
                  })
                }
              >
                {opt.label}
              </Chip>
            ))}
          </ChipScroller>
        </FilterGroup>
      </div>

      {/* Price ──────────────────────────────────────────────── */}
      <FilterGroup label="Цена">
        <div className="flex items-center gap-2">
          <PriceInput
            placeholder="от"
            value={value.priceMin}
            onCommit={(v) => onChange({ ...value, priceMin: v })}
          />
          <span className="text-white/30">—</span>
          <PriceInput
            placeholder="до"
            value={value.priceMax}
            onCommit={(v) => onChange({ ...value, priceMax: v })}
          />
        </div>
      </FilterGroup>

      {/* Reset chip — only shown when there's something to reset. */}
      {hasAny && (
        <button
          type="button"
          onClick={onReset}
          className="self-start rounded-full border border-white/15 px-4 py-2 text-[12.5px] text-white/75 transition-colors hover:border-white/30 hover:bg-white/[0.04] hover:text-white"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="eyebrow mb-2.5">{label}</div>
      {children}
    </div>
  );
}

/**
 * Horizontally scrollable chip row. Beats wrapping for long lists
 * (Plan A has 8+ games) — wrapping makes the panel grow tall and
 * pushes the grid below the fold on small viewports.
 *
 * `-mx-1 px-1` lets the focus ring on the first chip not get clipped
 * at the scroll boundary.
 */
function ChipScroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-[12.5px] transition-colors duration-200",
        active
          ? "border-white bg-white text-black"
          : "border-white/[0.09] bg-white/[0.025] text-white/80 hover:border-white/25 hover:bg-white/[0.05] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Number input with onCommit semantics.
 *
 * Why we don't update on every keystroke:
 *   `priceMin` and `priceMax` participate in the request URL. Firing
 *   on every key would send a request for "1", "12", "123", ...
 *   The blur + Enter pattern below batches user intent without
 *   forcing them to press a "Apply" button.
 */
function PriceInput({
  value,
  placeholder,
  onCommit,
}: {
  value: number | undefined;
  placeholder: string;
  onCommit: (v: number | undefined) => void;
}) {
  const [draft, setDraft] = useState<string>(value != null ? String(value) : "");
  useEffect(() => {
    setDraft(value != null ? String(value) : "");
  }, [value]);

  function commit() {
    if (draft === "") {
      if (value !== undefined) onCommit(undefined);
      return;
    }
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      // Reject silently and revert. A toast would be overkill for an
      // optional filter; the input visibly snaps back to the last
      // accepted value via the useEffect above.
      setDraft(value != null ? String(value) : "");
      return;
    }
    if (parsed !== value) onCommit(parsed);
  }

  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      placeholder={placeholder}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className="h-10 w-full rounded-xl border border-white/[0.09] bg-white/[0.025] px-3 text-[13.5px] text-white placeholder-white/35 outline-none transition-colors focus-visible:border-white/30"
    />
  );
}
