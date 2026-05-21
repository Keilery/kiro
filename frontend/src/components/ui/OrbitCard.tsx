import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
  interactive?: boolean;
  inset?: boolean;
};

/**
 * OrbitCard — стеклянная карточка с тонкой космической кромкой и опциональным glow border.
 */
export const OrbitCard = forwardRef<HTMLDivElement, Props>(function OrbitCard(
  { glow, interactive, inset, className, children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-orbit border border-white/[0.07] bg-white/[0.02]",
        "shadow-orbit-edge backdrop-blur-md",
        inset && "shadow-orbit-deep",
        glow && "glow-border",
        interactive &&
          "transition-all duration-500 ease-warp hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-halo-white",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
