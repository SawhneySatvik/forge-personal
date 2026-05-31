"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NAV } from "./nav-items";
import { NavLink } from "./nav-link";
import { ThemeToggle } from "./theme-toggle";

export function Sidebar({ email }: { email?: string | null }) {
  return (
    <aside className="bg-sidebar border-sidebar-border sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r md:flex lg:w-64">
      <div className="flex h-14 items-center px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <Flame className="text-primary size-5" />
          Forge
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="border-sidebar-border space-y-2 border-t p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground min-w-0 truncate text-xs">
            {email}
          </span>
          <ThemeToggle />
        </div>
        <form action="/signout" method="post">
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}
