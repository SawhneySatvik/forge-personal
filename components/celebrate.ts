/** Streak lengths worth celebrating with a small flourish. */
export const STREAK_MILESTONES = [7, 30, 60, 100, 200, 365];

export function isMilestone(count: number): boolean {
  return STREAK_MILESTONES.includes(count);
}

/**
 * Fire a subtle ember-colored confetti burst. No-ops under reduced motion or on
 * the server. Imported dynamically so canvas-confetti never ships to first load.
 */
export async function fireConfetti(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.7 },
    colors: ["#F97316", "#F5A524", "#FCD34D", "#FB923C"],
    disableForReducedMotion: true,
  });
}
