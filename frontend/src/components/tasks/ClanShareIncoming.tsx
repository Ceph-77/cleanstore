import { useState } from "react";
import { Button } from "../common/Button";
import { useShareClaimsForTask, useDecideShareClaim } from "../../hooks/useClanShares";

/** Réclamations de part de clan reçues sur MA tâche (je suis le réservateur) — accepter/refuser. */
export function ClanShareIncoming({ taskId }: { taskId: string }) {
  const { data: claims } = useShareClaimsForTask(taskId);
  const decide = useDecideShareClaim(taskId);
  const [error, setError] = useState<string | null>(null);

  const pending = claims?.filter((c) => c.status === "pending") ?? [];
  if (pending.length === 0) return null;

  async function handleDecide(id: string, decision: "accepted" | "refused") {
    setError(null);
    try {
      await decide.mutateAsync({ id, decision });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de décider.");
    }
  }

  return (
    <div className="mt-2 space-y-2 rounded-xl bg-linen-100/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-canvas-600">
        Réclamations de part de clan
      </p>
      {pending.map((c) => (
        <div key={c.id} className="rounded-lg bg-white p-3">
          <p className="text-sm text-canvas-900">
            <span className="font-medium">{c.claimant.fullName ?? c.claimant.email}</span> demande{" "}
            <span className="font-semibold">{c.percent}%</span>
          </p>
          {c.note && <p className="mt-1 text-xs text-canvas-600">« {c.note} »</p>}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="secondary" disabled={decide.isPending} onClick={() => handleDecide(c.id, "refused")}>
              Refuser
            </Button>
            <Button variant="accent" disabled={decide.isPending} onClick={() => handleDecide(c.id, "accepted")}>
              Accepter
            </Button>
          </div>
        </div>
      ))}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">{error}</p>
      )}
    </div>
  );
}
