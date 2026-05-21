"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
};

/**
 * SpaceButton — космическая кнопка. Primary — белый на чёрном с glow на hover,
 * Secondary — стеклянная с тонкой кромкой, Ghost — без фона.
 *
 * Анимации: shimmer-sweep, magnetic glow. Внутри одна функция, никаких портов.
 */
export const SpaceButton = forwardRef<HTMLButtonElement, Props>(function SpaceButton(
  {
    variant = "primary",
    size = "md",
    iconLeft,
    iconRight,
    fullWidth,
    className,
    children,
    ...rest
  },
  ref
) {
  const sizes: Record<Size, string> = {
    sm: "h-9 px-4 text-[13px]",
    md: "h-11 px-5 text-[14px]",
    lg: "h-14 px-7 text-[15px]"
  };

  const variants: Record<Variant, string> = {
    primary:
      "bg-space-white text-space-black hover:shadow-halo-strong hover:-translate-y-px",
    secondary:
      "bg-white/[0.04] text-space-lunar border border-white/10 hover:bg-white/[0.07] hover:border-white/20 backdrop-blur-md",
    ghost:
      "bg-transparent text-space-lunar hover:bg-white/[0.04] border border-transparent hover:border-white/10",
    danger:
      "bg-nova-red/15 text-nova-red border border-nova-red/30 hover:bg-nova-red/25"
  };

  return (
    <button
      ref={ref}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium",
        "transition-all duration-300 ease-warp",
        "disabled:pointer-events-none disabled:opacity-40",
        sizes[size],
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {/* Shimmer sweep */}
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:translate-x-full group-hover:opacity-100"
          style={{ transition: "transform 0.9s ease, opacity 0.3s ease" }}
        />
      )}
      {iconLeft && <span className="relative shrink-0">{iconLeft}</span>}
      <span className="relative whitespace-nowrap tracking-tight">{children}</span>
      {iconRight && <span className="relative shrink-0">{iconRight}</span>}
    </button>
  );
});
