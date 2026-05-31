/** Shared UI helpers used across pages. */

/** Tailwind text color for a DSA difficulty label. */
export function difficultyClass(difficulty: string | null): string {
  switch (difficulty) {
    case "Easy":
      return "text-emerald-600 dark:text-emerald-400";
    case "Medium":
      return "text-amber-600 dark:text-amber-400";
    case "Hard":
      return "text-rose-600 dark:text-rose-400";
    default:
      return "text-muted-foreground";
  }
}

/** Pill (chip) styles for a difficulty badge — tinted bg + text. */
export function difficultyChipClass(difficulty: string | null): string {
  switch (difficulty) {
    case "Easy":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "Medium":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "Hard":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}
