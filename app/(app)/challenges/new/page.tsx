import { ChallengePhaseEditor } from "../_components/challenge-phase-editor";

export default function NewChallengePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New challenge</h1>
        <p className="text-muted-foreground text-sm">
          Define the phases and the topics you&apos;ll work through each day.
        </p>
      </div>
      <ChallengePhaseEditor mode="create" />
    </div>
  );
}
