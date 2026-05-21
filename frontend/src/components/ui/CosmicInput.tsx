"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  label?: string;
  hint?: string;
  error?: string;
};

/**
 * CosmicInput — инпут с орбитальной подсветкой фокуса.
 */
export const CosmicInput = forwardRef<HTMLInputElement, Props>(function CosmicInput(
  { iconLeft, iconRight, label, hint, error, className, ...rest },
  ref
) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-space-dust">
          {label}
        </span>
      )}
      <div
        className={cn(
          "group relative flex items-center rounded-orbit border border-white/[0.08] bg-white/[0.025]",
          "transition-all duration-200 focus-within:border-white/30 focus-within:bg-white/[0.05]",
          "focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.04)]",
          error && "border-nova-red/40 focus-within:border-nova-red/60"
        )}
      >
        {iconLeft && (
          <span className="pl-3.5 text-space-dust group-focus-within:text-space-lunar">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "h-11 flex-1 bg-transparent px-4 text-[14px] text-space-white",
            "placeholder:text-space-dust/70 outline-none",
            iconLeft && "pl-2.5",
            iconRight && "pr-2",
            className
          )}
          {...rest}
        />
        {iconRight && (
          <span className="pr-3.5 text-space-dust group-focus-within:text-space-lunar">
            {iconRight}
          </span>
        )}
      </div>
      {hint && !error && (
        <span className="mt-1.5 block text-[12px] text-space-dust">{hint}</span>
      )}
      {error && <span className="mt-1.5 block text-[12px] text-nova-red">{error}</span>}
    </label>
  );
});
