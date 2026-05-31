import { notFound } from "next/navigation";
import { getProject } from "@/lib/queries";
import { ProjectForm } from "../../_components/project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit project</h1>
        <p className="text-muted-foreground text-sm">{project.name}</p>
      </div>
      <ProjectForm mode="edit" project={project} />
    </div>
  );
}
