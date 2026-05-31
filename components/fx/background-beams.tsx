"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Subtle drifting ember glows for behind auth cards / empty states.
 * Absolutely positioned, non-interactive; the drifting blob stops under
 * reduced motion (a static faint glow remains).
 */
export function BackgroundBeams({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute -top-1/3 left-1/4 h-[55vh] w-[55vh] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--primary) 40%, transparent), transparent 70%)",
        }}
      />
      {!reduce && (
        <motion.div
          className="absolute right-[8%] bottom-[-20%] h-[48vh] w-[48vh] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklch, var(--primary) 50%, transparent), transparent 70%)",
          }}
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
