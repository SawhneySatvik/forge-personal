import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listProjectsWithLastMilestone } from "@/lib/queries";
import type { ProjectStatus } from "@/lib/types";
import { ProjectCard } from "./_components/project-card";

const ORDER: ProjectStatus[] = ["Active", "Shipped", "Paused", "Killed"];

export default async function ProjectsPage() {
  const projects = await listProjectsWithLastMilestone();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            What you&apos;re building, and where each one stands.
          </p>
        </div>
        <Button render={<Link href="/projects/new" />} nativeButton={false}>
          <Plus className="size-4" /> New
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">
          No projects yet. Add one to start tracking it.
        </p>
      ) : (
        ORDER.map((status) => {
          const group = projects.filter((p) => p.status === status);
          if (group.length === 0) return null;
          return (
            <section key={status} className="space-y-2">
              <h2 className="text-muted-foreground text-sm font-medium">
                {status}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
