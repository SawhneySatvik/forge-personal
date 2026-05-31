import { ProjectForm } from "../_components/project-form";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="text-muted-foreground text-sm">
          Track a side project and its milestones.
        </p>
      </div>
      <ProjectForm mode="create" />
    </div>
  );
}
