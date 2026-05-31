import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProjectWithLastMilestone } from "@/lib/queries";
import type { ProjectStatus } from "@/lib/types";

function statusVariant(
  status: ProjectStatus,
): "default" | "secondary" | "outline" {
  if (status === "Active") return "default";
  if (status === "Shipped") return "secondary";
  return "outline";
}

export function ProjectCard({
  project,
}: {
  project: ProjectWithLastMilestone;
}) {
  const last = project.milestones[0];
  return (
    <Link href={`/projects/${project.id}`} className="block">
      <Card className="h-full transition-shadow hover:ring-foreground/20">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium">{project.name}</span>
            <Badge variant={statusVariant(project.status)}>
              {project.status}
            </Badge>
          </div>
          {project.description ? (
            <p className="text-muted-foreground line-clamp-1 text-sm">
              {project.description}
            </p>
          ) : null}
          {project.tags.length ? (
            <div className="flex flex-wrap gap-1">
              {project.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          ) : null}
          <p className="text-muted-foreground text-xs">
            {last ? (
              <>
                <span className="font-mono tabular-nums">{last.date}</span> ·{" "}
                {last.note}
              </>
            ) : (
              "No milestones yet"
            )}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
