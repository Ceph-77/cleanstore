import { useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { useContributionsAdmin, useDecideContribution } from "../../hooks/useContributions";
import type { Contribution, ContributionStatus } from "../../types";

const STATUS_LABELS: Record<ContributionStatus, string> = {
  soumise: "Soumise",
  a_l_etude: "À l'étude",
  adoptee: "Adoptée",
  rejetee: "Rejetée",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

function ContributionRow({ contribution }: { contribution: Contribution }) {
  const decide = useDecideContribution();
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-canvas-900">
            {contribution.title}
            {contribution.category && (
              <span className="ml-2 rounded-full bg-linen-100 px-2 py-0.5 text-[11px] font-medium text-linen-800">
                {contribution.category}
              </span>
            )}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-canvas-700">{contribution.description}</p>
          <p className="mt-1 text-xs text-canvas-500">
            {contribution.submittedBy?.fullName ?? contribution.submittedBy?.email ?? "Anonyme"} ·{" "}
            {formatDateTime(contribution.createdAt)}
          </p>
        </div>
        <select
          value={contribution.status}
          onChange={(e) => decide.mutate({ id: contribution.id, data: { status: e.target.value as ContributionStatus } })}
          className="shrink-0 rounded-full border border-canvas-300 bg-white px-2.5 py-1 text-xs font-medium"
        >
          {Object.entries(STATUS_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {contribution.status !== "adoptee" && contribution.status !== "rejetee" && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-canvas-200 pt-3">
          <div>
            <label className="text-xs font-medium text-canvas-800">Points à accorder (si adoptée)</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="mt-1 w-32 rounded-lg border border-canvas-300 bg-white px-2 py-1 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-canvas-800">Note de décision</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-canvas-300 bg-white px-2 py-1 text-sm"
            />
          </div>
          <Button
            variant="accent"
            disabled={decide.isPending}
            onClick={() =>
              decide.mutate({
                id: contribution.id,
                data: {
                  status: "adoptee",
                  decisionNote: note.trim() || undefined,
                  pointsAwarded: points ? Number(points) : undefined,
                },
              })
            }
          >
            Adopter
          </Button>
          <Button
            variant="danger"
            disabled={decide.isPending}
            onClick={() =>
              decide.mutate({ id: contribution.id, data: { status: "rejetee", decisionNote: note.trim() || undefined } })
            }
          >
            Rejeter
          </Button>
        </div>
      )}
      {contribution.decisionNote && (
        <p className="mt-2 rounded-lg bg-canvas-50 px-3 py-2 text-xs text-canvas-700">
          {contribution.decisionNote}
        </p>
      )}
    </div>
  );
}

export function ContributionsPage() {
  const [status, setStatus] = useState<ContributionStatus | "all">("soumise");
  const { data: contributions, isLoading } = useContributionsAdmin(status);

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Contributions</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Idées soumises par les travailleurs — adopter accorde des points (append-only), jamais de prime $
        automatique.
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {(["soumise", "a_l_etude", "adoptee", "rejetee", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              status === s ? "bg-flow-600 text-white" : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
            }`}
          >
            {s === "all" ? "Tout" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {!isLoading && (!contributions || contributions.length === 0) && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucune contribution pour ce filtre.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {contributions?.map((c) => (
          <ContributionRow key={c.id} contribution={c} />
        ))}
      </div>
    </AppLayout>
  );
}
