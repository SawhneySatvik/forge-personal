import { cn } from "@/lib/utils";

/** Consistent empty / "no data" placeholder. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground rounded-lg border p-8 text-center text-sm",
        className,
      )}
    >
      <p className="text-foreground font-medium">{title}</p>
      {description ? <p className="mt-1">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
