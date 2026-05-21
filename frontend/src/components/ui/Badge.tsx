import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "outline";

type Props = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant;
  icon?: ReactNode;
  dot?: boolean;
};

const variants: Record<Variant, string> = {
  default: "bg-white/[0.06] text-space-lunar border-white/10",
  success: "bg-nova-green/10 text-nova-green border-nova-green/25",
  warning: "bg-nova-amber/10 text-nova-amber border-nova-amber/25",
  danger: "bg-nova-red/10 text-nova-red border-nova-red/25",
  info: "bg-nova-blue/10 text-nova-blue border-nova-blue/25",
  outline: "bg-transparent text-space-lunar border-white/20"
};

export const Badge = forwardRef<HTMLSpanElement, Props>(function Badge(
  { variant = "default", icon, dot, className, children, ...rest },
  ref
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
        "font-mono text-[11px] font-medium uppercase tracking-wider",
        variants[variant],
        className
      )}
      {...rest}
    >
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-current"
          aria-hidden
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
});
