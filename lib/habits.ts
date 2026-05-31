import type { HabitKey } from "@/lib/types";

/** The fixed set of daily-checklist habits, in dashboard display order. */
export interface HabitDef {
  key: HabitKey;
  label: string;
  short: string;
  /** The daily_logs column this habit reads/writes. */
  column:
    | "dsa_done"
    | "gym_status"
    | "system_design_done"
    | "posted_x"
    | "posted_linkedin";
  cadenceLabel: string;
  /** Gym: a 'rest' day bridges the streak rather than breaking it. */
  restAware: boolean;
  href: string;
}

export const HABITS: HabitDef[] = [
  {
    key: "dsa",
    label: "DSA",
    short: "DSA",
    column: "dsa_done",
    cadenceLabel: "Daily",
    restAware: false,
    href: "/dsa",
  },
  {
    key: "system_design",
    label: "System Design",
    short: "Sys Design",
    column: "system_design_done",
    cadenceLabel: "Daily",
    restAware: false,
    href: "/system-design",
  },
  {
    key: "gym",
    label: "Gym",
    short: "Gym",
    column: "gym_status",
    cadenceLabel: "Daily · rest days OK",
    restAware: true,
    href: "/gym",
  },
  {
    key: "x",
    label: "X / Twitter",
    short: "X",
    column: "posted_x",
    cadenceLabel: "Daily in challenges · weekly otherwise",
    restAware: false,
    href: "/social",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    short: "LinkedIn",
    column: "posted_linkedin",
    cadenceLabel: "Weekly",
    restAware: false,
    href: "/social",
  },
];

export const HABITS_BY_KEY = Object.fromEntries(
  HABITS.map((h) => [h.key, h]),
) as Record<HabitKey, HabitDef>;
