import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-ios border border-white/[0.08] bg-white/[0.03] p-6",
        "transition-colors duration-300 ease-out-quart hover:border-white/15 hover:bg-white/[0.05]",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
