import { useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { TaskStatusBadge } from "../../components/tasks/TaskStatusBadge";
import { IconTasks, IconMapPin, IconFile } from "../../components/common/icons";
import { useMyTasks, useUpdateMyTaskStatus, useMyTaskInspection } from "../../hooks/useMyTasks";
import { useMyTaskClaims } from "../../hooks/useMarketplace";
import type { Task } from "../../types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-CA");
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-flow-100 text-flow-800 ring-flow-200";
  if (score >= 50) return "bg-linen-100 text-linen-800 ring-linen-200";
  return "bg-red-50 text-red-700 ring-red-200";
}

function InspectionDetails({ taskId }: { taskId: string }) {
  const { data: inspection, isLoading } = useMyTaskInspection(taskId, true);

  if (isLoading) return <p className="mt-3 text-xs text-canvas-600">Chargement de l'inspection...</p>;
  if (!inspection) return <p className="mt-3 text-xs text-canvas-600">Aucun détail d'inspection disponible.</p>;

  return (
    <div className="mt-3 rounded-xl bg-canvas-50 p-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreColor(inspection.score)}`}
        >
          {inspection.score}/100
        </span>
        <span className="text-xs text-canvas-600">{formatDate(inspection.createdAt)}</span>
      </div>
      {inspection.notes && <p className="mt-2 whitespace-pre-line text-sm text-canvas-900">{inspection.notes}</p>}
      {inspection.photos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {inspection.photos.map((photo) => (
            <a
              key={photo.id}
              href={photo.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-canvas-700 ring-1 ring-canvas-200 hover:bg-canvas-100"
            >
              <IconFile className="h-3 w-3" />
              {photo.photoType === "before" ? "Avant" : "Après"}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const updateStatus = useUpdateMyTaskStatus();
  const [showNoteField, setShowNoteField] = useState(false);
  const [note, setNote] = useState("");
  const [showInspection, setShowInspection] = useState(false);

  async function handleComplete() {
    await updateStatus.mutateAsync({ taskId: task.id, status: "completed", note: note || undefined });
    setShowNoteField(false);
    setNote("");
  }

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-flow-100 text-flow-700">
          <IconTasks className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-canvas-900">
            {task.description}
            {task.taskType && <span className="ml-1 text-canvas-600">({task.taskType})</span>}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-canvas-600">
            <IconMapPin className="h-3 w-3 shrink-0" />
            {task.store?.name} · {task.store?.city ?? "—"}
          </p>
        </div>
        <p className="font-heading font-semibold text-canvas-900">{Number(task.price).toFixed(2)} $</p>
        <TaskStatusBadge status={task.status} />
        <div className="shrink-0">
          {task.status === "claimed" && (
            <Button
              variant="accent"
              className="w-full sm:w-auto"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate({ taskId: task.id, status: "in_progress" })}
            >
              Démarrer
            </Button>
          )}
          {task.status === "in_progress" && !showNoteField && (
            <Button variant="accent" className="w-full sm:w-auto" onClick={() => setShowNoteField(true)}>
              Marquer complétée
            </Button>
          )}
          {task.status === "inspected" && (
            <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setShowInspection((v) => !v)}>
              {showInspection ? "Masquer l'inspection" : "Voir l'inspection"}
            </Button>
          )}
        </div>
      </div>

      {showNoteField && (
        <div className="mt-3 space-y-2 rounded-xl bg-flow-50/60 p-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Remarque optionnelle (ex: il manquait du produit à vitres)"
            className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowNoteField(false)}>
              Annuler
            </Button>
            <Button variant="accent" disabled={updateStatus.isPending} onClick={handleComplete}>
              {updateStatus.isPending ? "Enregistrement..." : "Confirmer"}
            </Button>
          </div>
        </div>
      )}

      {task.status === "inspected" && task.workerNote && (
        <p className="mt-3 text-xs text-canvas-600">Ta remarque : {task.workerNote}</p>
      )}

      {showInspection && <InspectionDetails taskId={task.id} />}
    </div>
  );
}

export function MyTasksPage() {
  const { data: tasks, isLoading } = useMyTasks();
  const { data: claims } = useMyTaskClaims();

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Marketplace</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Mes tâches</h1>
      <p className="mt-1 text-sm text-canvas-600">Le travail que tu as réclamé, et où tu en es.</p>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {tasks && tasks.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-canvas-600">Aucune tâche en cours pour l'instant.</p>
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <div className="mt-6 space-y-3">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}

      {claims && claims.length > 0 && (
        <>
          <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-canvas-600">
            Historique de mes réclamations
          </h2>
          <div className="mt-3 space-y-2">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-canvas-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-canvas-900">
                    {claim.task?.description} <span className="text-canvas-600">({claim.task?.store?.name})</span>
                  </p>
                  <p className="text-xs text-canvas-600">{formatDate(claim.createdAt)}</p>
                </div>
                {claim.status === "pending" && (
                  <span className="shrink-0 rounded-full bg-linen-100 px-2.5 py-0.5 text-xs font-medium text-linen-800">
                    En attente
                  </span>
                )}
                {claim.status === "approved" && (
                  <span className="shrink-0 rounded-full bg-flow-100 px-2.5 py-0.5 text-xs font-medium text-flow-800">
                    Approuvée
                  </span>
                )}
                {claim.status === "rejected" && (
                  <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    Refusée
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
