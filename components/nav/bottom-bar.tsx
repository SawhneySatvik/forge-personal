"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV } from "./nav-items";

export function BottomBar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const primary = NAV.filter((n) => n.primary);
  const overflow = NAV.filter((n) => !n.primary);
  const overflowActive = overflow.some((o) => isActive(o.href));

  return (
    <nav className="bg-background/90 fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {primary.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors outline-none",
            overflowActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          <MoreHorizontal className="size-5" />
          <span>More</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="mb-2 min-w-40">
          {overflow.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
                <Icon className="size-4" /> {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}
