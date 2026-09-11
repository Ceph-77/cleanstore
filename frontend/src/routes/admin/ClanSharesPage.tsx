import { useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { useAllShareClaims, useInspectorAwardShare } from "../../hooks/useClanShares";
import type { ClanShareClaim, ClanShareStatus } from "../../types";

const STATUS_LABELS: Record<ClanShareStatus, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  refused: "Refusée",
  inspector_awarded: "Attribuée par inspecteur",
};

const STATUS_STYLES: Record<ClanShareStatus, string> = {
  pending: "bg-linen-100 text-linen-800",
  accepted: "bg-green-50 text-green-700",
  refused: "bg-red-50 text-red-700",
  inspector_awarded: "bg-flow-100 text-flow-700",
};

const SHARE_PERCENTS = [25, 50, 75, 85] as const;

function ClaimRow({ claim }: { claim: ClanShareClaim }) {
  const award = useInspectorAwardShare();
  const [percent, setPercent] = useState<number>(claim.percent);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canOverride = claim.status === "pending" || claim.status === "refused";

  async function handleAward() {
    setError(null);
    try {
      await award.mutateAsync({ id: claim.id, percent, decisionNote: note.trim() || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'attribuer.");
    }
  }

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-canvas-900">
            {claim.task.description}{" "}
            <span className="text-canvas-600">— {claim.claimant.fullName ?? claim.claimant.email}</span>
          </p>
          {claim.note && <p className="mt-1 text-xs text-canvas-600">« {claim.note} »</p>}
          <p className="mt-1 text-xs text-canvas-500">
            Demandé : {claim.percent}%
            {claim.decisionNote && <> · {claim.decisionNote}</>}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[claim.status]}`}>
          {STATUS_LABELS[claim.status]}
        </span>
      </div>

      {canOverride && (
        <div className="mt-3 space-y-2 border-t border-canvas-200 pt-3">
          <p className="text-xs text-canvas-600">
            Exception inspecteur (Q18) — seulement si tu as toi-même demandé à ce coéquipier de
            faire/refaire une partie manquante et que c'est confirmé.
          </p>
          <div className="flex flex-wrap gap-2">
            {SHARE_PERCENTS.map((p) => (
              <button
                key={p}
                onClick={() => setPercent(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  percent === p ? "bg-flow-600 text-white" : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note de décision"
            className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">{error}</p>
          )}
          <div className="flex justify-end">
            <Button variant="accent" disabled={award.isPending} onClick={handleAward}>
              {award.isPending ? "..." : `Attribuer ${percent}%`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ClanSharesPage() {
  const { data: claims, isLoading } = useAllShareClaims();

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Parts de clan</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Réclamations de part entre coéquipiers de clan. Le réservateur décide normalement — l'attribution
        par inspecteur est l'exception (Q18).
      </p>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}
      {!isLoading && (!claims || claims.length === 0) && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucune réclamation pour l'instant.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {claims?.map((c) => (
          <ClaimRow key={c.id} claim={c} />
        ))}
      </div>
    </AppLayout>
  );
}
