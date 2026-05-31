"use client";

import { cn } from "@/lib/utils";

// Fixed positions → deterministic (no SSR/hydration mismatch).
const POSITIONS = [
  { top: "-10%", left: "15%", delay: "0s" },
  { top: "5%", left: "85%", delay: "0.15s" },
  { top: "80%", left: "10%", delay: "0.3s" },
  { top: "70%", left: "90%", delay: "0.1s" },
  { top: "35%", left: "50%", delay: "0.22s" },
];

/**
 * Ambient ember sparkles around `children`, shown when `active`. Purely
 * CSS-animated (sparkle-ping keyframe) so it's disabled under reduced motion.
 */
export function Sparkles({
  active,
  className,
  children,
}: {
  active: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span className={cn("relative inline-flex", className)}>
      {children}
      {active ? (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {POSITIONS.map((p, i) => (
            <span
              key={i}
              className="bg-primary absolute size-1 rounded-full"
              style={{
                top: p.top,
                left: p.left,
                animation: `sparkle-ping 1s ease-out ${p.delay} infinite`,
              }}
            />
          ))}
        </span>
      ) : null}
    </span>
  );
}
