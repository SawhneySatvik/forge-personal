import {
  Code2,
  Dumbbell,
  LayoutDashboard,
  Network,
  Settings,
  Share2,
  Trophy,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Shown directly on the mobile bottom bar (vs. tucked into "More"). */
  primary: boolean;
}

export const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, primary: true },
  { href: "/dsa", label: "DSA", icon: Code2, primary: true },
  { href: "/system-design", label: "System Design", icon: Network, primary: true },
  { href: "/gym", label: "Gym", icon: Dumbbell, primary: true },
  { href: "/social", label: "Social", icon: Share2, primary: false },
  { href: "/challenges", label: "Challenges", icon: Trophy, primary: false },
  { href: "/settings", label: "Settings", icon: Settings, primary: false },
];
