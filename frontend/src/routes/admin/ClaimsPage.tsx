import { Link } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import {
  useStoreClaimsAdmin,
  useDecideStoreClaim,
  useTaskClaimsAdmin,
  useDecideTaskClaim,
} from "../../hooks/useClaimsAdmin";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

export function ClaimsPage() {
  const { data: storeClaims } = useStoreClaimsAdmin("pending");
  const decideStoreClaim = useDecideStoreClaim();
  const { data: taskClaims } = useTaskClaimsAdmin("pending");
  const decideTaskClaim = useDecideTaskClaim();

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Demandes en attente</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Approuve ou refuse les demandes des sous-traitants (magasins) et travailleurs autonomes (tâches).
      </p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-canvas-600">Magasins</h2>
      <div className="mt-3 space-y-3">
        {storeClaims && storeClaims.length === 0 && (
          <p className="rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-8 text-center text-sm text-canvas-600">
            Aucune demande de magasin en attente.
          </p>
        )}
        {storeClaims?.map((claim) => (
          <div
            key={claim.id}
            className="flex flex-col gap-3 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-canvas-900">
                <Link to={`/stores/${claim.storeId}`} className="text-flow-700 hover:underline">
                  {claim.store?.name}
                </Link>{" "}
                — {claim.organization?.name}
              </p>
              <p className="mt-0.5 text-xs text-canvas-600">
                Demandé par {claim.requestedBy?.fullName ?? claim.requestedBy?.email} · {formatDateTime(claim.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                disabled={decideStoreClaim.isPending}
                onClick={() => decideStoreClaim.mutate({ id: claim.id, status: "rejected" })}
              >
                Refuser
              </Button>
              <Button
                variant="accent"
                disabled={decideStoreClaim.isPending}
                onClick={() => decideStoreClaim.mutate({ id: claim.id, status: "approved" })}
              >
                Approuver
              </Button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-canvas-600">Tâches</h2>
      <div className="mt-3 space-y-3">
        {taskClaims && taskClaims.length === 0 && (
          <p className="rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-8 text-center text-sm text-canvas-600">
            Aucune demande de tâche en attente.
          </p>
        )}
        {taskClaims?.map((claim) => (
          <div
            key={claim.id}
            className="flex flex-col gap-3 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5 sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-canvas-900">
                {claim.task?.description}{" "}
                <span className="text-canvas-600">
                  ({claim.task?.store?.name}, {Number(claim.task?.price ?? 0).toFixed(2)} $)
                </span>
              </p>
              <p className="mt-0.5 text-xs text-canvas-600">
                Demandé par {claim.worker?.fullName ?? claim.worker?.email} · {formatDateTime(claim.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                disabled={decideTaskClaim.isPending}
                onClick={() => decideTaskClaim.mutate({ id: claim.id, status: "rejected" })}
              >
                Refuser
              </Button>
              <Button
                variant="accent"
                disabled={decideTaskClaim.isPending}
                onClick={() => decideTaskClaim.mutate({ id: claim.id, status: "approved" })}
              >
                Approuver
              </Button>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
