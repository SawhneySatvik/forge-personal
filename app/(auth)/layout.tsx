import { Flame } from "lucide-react";
import { BackgroundBeams } from "@/components/fx/background-beams";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
      <BackgroundBeams />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Flame className="text-primary size-6" />
            <span className="text-2xl font-semibold tracking-tight">Forge</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Your accountability tracker
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
