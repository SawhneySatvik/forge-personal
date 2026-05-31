import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { todayInTz } from "@/lib/date";
import { DEFAULT_TIMEZONE, getProfile, getProject } from "@/lib/queries";
import { AddMilestoneForm } from "../_components/add-milestone-form";
import { MilestoneTimeline } from "../_components/milestone-timeline";
import { ProjectControls } from "../_components/project-controls";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [profile, project] = await Promise.all([getProfile(), getProject(id)]);
  if (!project) notFound();

  const today = todayInTz(profile?.timezone ?? DEFAULT_TIMEZONE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <Badge variant={project.status === "Active" ? "default" : "outline"}>
              {project.status}
            </Badge>
          </div>
          {project.description ? (
            <p className="text-muted-foreground mt-1 text-sm">
              {project.description}
            </p>
          ) : null}
          {project.tags.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {project.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <ProjectControls id={project.id} status={project.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <AddMilestoneForm projectId={project.id} today={today} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-medium">Timeline</h2>
        <MilestoneTimeline milestones={project.milestones} projectId={project.id} />
      </div>
    </div>
  );
}
