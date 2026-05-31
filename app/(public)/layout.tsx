import Link from "next/link";
import { Flame } from "lucide-react";
import { ThemeToggle } from "@/components/nav/theme-toggle";

/** Minimal shell for unauthenticated public pages — no sidebar/bottom bar. */
export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Flame className="text-primary size-5" />
            <span className="font-semibold tracking-tight">Forge</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/signin"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Track your own →
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
