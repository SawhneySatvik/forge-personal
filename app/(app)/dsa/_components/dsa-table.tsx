import { Badge } from "@/components/ui/badge";
import type { DsaProblem } from "@/lib/types";
import { difficultyClass } from "@/lib/ui";

function ProblemName({ p }: { p: DsaProblem }) {
  if (!p.problem_url) return <>{p.name}</>;
  return (
    <a
      href={p.problem_url}
      target="_blank"
      rel="noopener noreferrer"
      className="underline-offset-4 hover:underline"
    >
      {p.name}
    </a>
  );
}

export function DsaTable({ problems }: { problems: DsaProblem[] }) {
  if (problems.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border p-6 text-center text-sm">
        No problems match these filters yet.
      </p>
    );
  }

  return (
    <>
      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50 text-muted-foreground text-left text-xs">
            <tr>
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Problem</th>
              <th className="p-3 font-medium">Topic</th>
              <th className="p-3 font-medium">Difficulty</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {problems.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="text-muted-foreground p-3 font-mono whitespace-nowrap tabular-nums">
                  {p.date}
                </td>
                <td className="p-3">
                  <span className="font-medium">
                    <ProblemName p={p} />
                  </span>
                  {p.notes ? (
                    <p className="text-muted-foreground mt-0.5 max-w-md text-xs">
                      {p.notes}
                    </p>
                  ) : null}
                </td>
                <td className="text-muted-foreground p-3">{p.topic ?? "—"}</td>
                <td
                  className={`p-3 font-medium ${difficultyClass(p.difficulty)}`}
                >
                  {p.difficulty ?? "—"}
                </td>
                <td className="p-3">
                  <Badge variant={p.solved ? "default" : "outline"}>
                    {p.solved ? "Solved" : "Attempted"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 md:hidden">
        {problems.map((p) => (
          <div
            key={p.id}
            className="bg-card ring-foreground/10 rounded-lg p-3 ring-1"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium">
                <ProblemName p={p} />
              </span>
              <Badge variant={p.solved ? "default" : "outline"}>
                {p.solved ? "Solved" : "Attempted"}
              </Badge>
            </div>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 text-xs">
              <span className="font-mono tabular-nums">{p.date}</span>
              {p.topic ? <span>· {p.topic}</span> : null}
              {p.difficulty ? (
                <span className={difficultyClass(p.difficulty)}>
                  · {p.difficulty}
                </span>
              ) : null}
            </div>
            {p.notes ? (
              <p className="text-muted-foreground mt-1 text-xs">{p.notes}</p>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
