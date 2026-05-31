import { cn } from "@/lib/utils";

/**
 * Monospaced, tabular numeral — use for streak counts, day counters, and
 * percentages so digits line up and feel like instrument readouts.
 */
export function Numeral({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn("font-mono tabular-nums tracking-tight", className)}
      {...props}
    />
  );
}
