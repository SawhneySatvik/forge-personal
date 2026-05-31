"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Count-up numeral. Animates from the previously shown value to `value`.
 * No-ops (renders the final value immediately) under reduced motion.
 */
export function AnimatedNumber({
  value,
  className,
  format,
  durationMs = 700,
}: {
  value: number;
  className?: string;
  format?: (n: number) => string;
  durationMs?: number;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (reduce || from === to) {
      setDisplay(to);
      fromRef.current = to;
      return;
    }
    let raf = 0;
    let startTs = 0;
    const step = (ts: number) => {
      if (!startTs) startTs = ts;
      const t = Math.min(1, (ts - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = from + (to - from) * eased;
      setDisplay(current);
      fromRef.current = current;
      if (t < 1) raf = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, reduce, durationMs]);

  const rounded = Math.round(display);
  return (
    <span className={cn("font-mono tabular-nums tracking-tight", className)}>
      {format ? format(rounded) : rounded}
    </span>
  );
}
