"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
  className?: string;
};

/**
 * GravityScroll — секции «всплывают» из невесомости при попадании во viewport.
 * Spring-like easing с лёгким overshoot имитирует орбитальное движение.
 */
export function GravityScroll({
  children,
  delay = 0,
  y = 24,
  duration = 0.8,
  once = true,
  className
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1] // ease-out exponential
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
