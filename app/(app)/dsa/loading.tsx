import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-72" />
      <Skeleton className="h-44" />
      <Skeleton className="h-64" />
    </div>
  );
}
