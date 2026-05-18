"use client";

import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ListingSort } from "@/lib/types";

/**
 * Sort dropdown for the marketplace grid.
 *
 * Native <select> on purpose — it gives us free OS-level styling on
 * iOS (the wheel picker), keyboard support, and screen-reader labels
 * with no JS. We re-skin the wrapper to match the rest of the page,
 * leaving the actual menu rendering to the platform.
 */

const OPTIONS: { value: ListingSort; label: string }[] = [
  { value: "newest", label: "Сначала новые" },
  { value: "popular", label: "По популярности" },
  { value: "price_asc", label: "Цена: дешевле" },
  { value: "price_desc", label: "Цена: дороже" },
  { value: "rating", label: "По рейтингу" },
];

export function SortBar({
  value,
  onChange,
  total,
  className,
}: {
  value: ListingSort | undefined;
  onChange: (next: ListingSort) => void;
  /** Optional count to show alongside the sort. */
  total?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-full border border-white/[0.09] bg-white/[0.025] px-4 py-2",
        className,
      )}
    >
      {total != null && (
        <span className="num text-[12.5px] text-white/55">
          {total === 1 ? "1 листинг" : `${total} листингов`}
        </span>
      )}
      <label className="ml-auto inline-flex items-center gap-2 text-[12.5px] text-white/65">
        <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.6} />
        <span>Сортировка:</span>
        <select
          value={value ?? "newest"}
          onChange={(e) => onChange(e.target.value as ListingSort)}
          className="cursor-pointer appearance-none bg-transparent pr-1 text-[13px] font-medium text-white outline-none"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink-950 text-white">
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
