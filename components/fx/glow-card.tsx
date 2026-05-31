"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Card-like surface with a mouse-following ember glow + ember hover ring.
 * Drop-in for shadcn <Card>: provide your own CardHeader/CardContent inside.
 * The glow is a CSS opacity transition (auto-disabled under reduced motion).
 */
export function GlowCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={cn(
        "group/glow bg-card text-card-foreground ring-foreground/10 hover:ring-primary/40 relative overflow-hidden rounded-xl ring-1 transition-shadow duration-300",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover/glow:opacity-100"
        style={{
          background:
            "radial-gradient(220px circle at var(--mx,50%) var(--my,50%), color-mix(in oklch, var(--primary) 18%, transparent), transparent 60%)",
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
