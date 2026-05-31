"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Wrap a CTA/button to give it a rotating ember gradient border on hover.
 * The inner surface (bg-background) masks the center, leaving a 1px ring.
 */
export function HoverBorderGradient({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      className={cn(
        "group/hbg relative inline-flex overflow-hidden rounded-lg p-px",
        className,
      )}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[180%] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover/hbg:opacity-100"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0 60%, var(--primary) 76%, transparent 92%)",
        }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={
          reduce ? undefined : { duration: 4, repeat: Infinity, ease: "linear" }
        }
      />
      <div className={cn("bg-background relative rounded-[7px]", innerClassName)}>
        {children}
      </div>
    </div>
  );
}
