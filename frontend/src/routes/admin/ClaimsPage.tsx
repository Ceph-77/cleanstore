import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import {
  useStoreClaimsAdmin,
  useDecideStoreClaim,
  useTaskClaimsAdmin,
  useDecideTaskClaim,
} from "../../hooks/useClaimsAdmin";
import type { StoreClaim, TaskClaim } from "../../types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA");
}

function RejectField({
  onCancel,
  onConfirm,
  submitting,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="mt-3 space-y-2 rounded-xl bg-red-50/60 p-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="Raison du refus (obligatoire, visible par le demandeur)"
        className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          variant="danger"
          disabled={!reason.trim() || submitting}
          onClick={() => onConfirm(reason.trim())}
        >
          {submitting ? "..." : "Confirmer le refus"}
        </Button>
      </div>
    </div>
  );
}

function StoreClaimRow({
  claim,
  onDecide,
  submitting,
}: {
  claim: StoreClaim;
  onDecide: (status: "approved" | "rejected", reason?: string) => void;
  submitting: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  const storeCount = claim.organization?._count?.storesAsSubcontractor ?? 0;

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-canvas-900">
            <Link to={`/stores/${claim.storeId}`} className="text-flow-700 hover:underline">
              {claim.store?.name}
            </Link>{" "}
            — {claim.organization?.name}
          </p>
          <p className="mt-0.5 text-xs text-canvas-600">
            Demandé par {claim.requestedBy?.fullName ?? claim.requestedBy?.email}
            {" · "}
            {storeCount} magasin{storeCount === 1 ? "" : "s"} déjà assigné{storeCount === 1 ? "" : "s"}
            {claim.requestedBy?.createdAt && <> · Membre depuis {formatDate(claim.requestedBy.createdAt)}</>}
            {" · "}
            {formatDateTime(claim.createdAt)}
          </p>
          {claim.note && (
            <p className="mt-2 rounded-lg bg-canvas-50 px-3 py-2 text-sm text-canvas-800">« {claim.note} »</p>
          )}
        </div>
        {!rejecting && (
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" disabled={submitting} onClick={() => setRejecting(true)}>
              Refuser
            </Button>
            <Button variant="accent" disabled={submitting} onClick={() => onDecide("approved")}>
              Approuver
            </Button>
          </div>
        )}
      </div>
      {rejecting && (
        <RejectField
          submitting={submitting}
          onCancel={() => setRejecting(false)}
          onConfirm={(reason) => onDecide("rejected", reason)}
        />
      )}
    </div>
  );
}

function TaskClaimRow({
  claim,
  onDecide,
  submitting,
}: {
  claim: TaskClaim;
  onDecide: (status: "approved" | "rejected", reason?: string) => void;
  submitting: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  const completedCount = claim.worker?._count?.assignedTasks ?? 0;
  const avgScore = claim.worker?.averageInspectionScore;

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-canvas-900">
            {claim.task?.description}{" "}
            <span className="text-canvas-600">
              ({claim.task?.store?.name}, {Number(claim.task?.price ?? 0).toFixed(2)} $)
            </span>
          </p>
          <p className="mt-0.5 text-xs text-canvas-600">
            Demandé par {claim.worker?.fullName ?? claim.worker?.email}
            {" · "}
            {completedCount} tâche{completedCount === 1 ? "" : "s"} complétée{completedCount === 1 ? "" : "s"}
            {avgScore != null && <> · score moyen {avgScore}/100</>}
            {claim.worker?.createdAt && <> · Membre depuis {formatDate(claim.worker.createdAt)}</>}
            {claim.task?.dueDate && <> · Échéance : {claim.task.dueDate.slice(0, 10)}</>}
            {" · "}
            {formatDateTime(claim.createdAt)}
          </p>
          {claim.note && (
            <p className="mt-2 rounded-lg bg-canvas-50 px-3 py-2 text-sm text-canvas-800">« {claim.note} »</p>
          )}
        </div>
        {!rejecting && (
          <div className="flex shrink-0 gap-2">
            <Button variant="secondary" disabled={submitting} onClick={() => setRejecting(true)}>
              Refuser
            </Button>
            <Button variant="accent" disabled={submitting} onClick={() => onDecide("approved")}>
              Approuver
            </Button>
          </div>
        )}
      </div>
      {rejecting && (
        <RejectField
          submitting={submitting}
          onCancel={() => setRejecting(false)}
          onConfirm={(reason) => onDecide("rejected", reason)}
        />
      )}
    </div>
  );
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
          <StoreClaimRow
            key={claim.id}
            claim={claim}
            submitting={decideStoreClaim.isPending}
            onDecide={(status, reason) => decideStoreClaim.mutate({ id: claim.id, status, reason })}
          />
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
          <TaskClaimRow
            key={claim.id}
            claim={claim}
            submitting={decideTaskClaim.isPending}
            onDecide={(status, reason) => decideTaskClaim.mutate({ id: claim.id, status, reason })}
          />
        ))}
      </div>
    </AppLayout>
  );
}
