"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-white text-black hover:bg-white/90 shadow-glass-edge",
  ghost:
    "bg-white/5 text-white hover:bg-white/10 border border-white/10",
  outline:
    "border border-white/20 text-white hover:bg-white/5"
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-7 text-base"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", className, children, iconLeft, iconRight, ...rest },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 rounded-full font-medium",
          "transition-all duration-300 ease-out-expo",
          "active:scale-[0.97] active:translate-y-[1px]",
          "disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...rest}
      >
        {iconLeft}
        <span>{children}</span>
        {iconRight}
      </button>
    );
  }
);
Button.displayName = "Button";
