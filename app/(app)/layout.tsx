import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, LogOut } from "lucide-react";
import { BottomBar } from "@/components/nav/bottom-bar";
import { Sidebar } from "@/components/nav/sidebar";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  return (
    <TooltipProvider>
      <div className="flex min-h-svh">
        <Sidebar email={user.email} />

        <div className="flex min-h-svh w-full min-w-0 flex-1 flex-col">
          {/* Mobile top bar — branding + theme + signout (sidebar is hidden < md). */}
          <header className="bg-background/80 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur md:hidden">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-semibold tracking-tight"
            >
              <Flame className="text-primary size-5" />
              Forge
            </Link>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <form action="/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  aria-label="Sign out"
                >
                  <LogOut className="size-4" />
                </Button>
              </form>
            </div>
          </header>

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-10 lg:px-8">
            {children}
          </main>
        </div>

        <BottomBar />
      </div>
    </TooltipProvider>
  );
}
