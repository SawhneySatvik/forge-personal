import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicNotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Not found</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        This page is private or doesn&apos;t exist.
      </p>
      <Button nativeButton={false} render={<Link href="/signin" />}>
        Go to Forge
      </Button>
    </div>
  );
}
