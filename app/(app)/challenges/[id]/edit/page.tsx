import { notFound } from "next/navigation";
import { getChallenge } from "@/lib/queries";
import { ChallengePhaseEditor } from "../../_components/challenge-phase-editor";

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = await getChallenge(id);
  if (!challenge) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit challenge</h1>
        <p className="text-muted-foreground text-sm">{challenge.name}</p>
      </div>
      <ChallengePhaseEditor mode="edit" challenge={challenge} />
    </div>
  );
}
