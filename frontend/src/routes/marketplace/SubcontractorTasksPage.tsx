import { useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { TaskStatusBadge } from "../../components/tasks/TaskStatusBadge";
import { TaskInstructionsForm } from "../../components/tasks/TaskInstructionsForm";
import { IconTasks, IconMapPin, IconUser } from "../../components/common/icons";
import { useSubcontractorTasks } from "../../hooks/useTaskInstructions";
import { useAssignableWorkers, useDirectAssign } from "../../hooks/useMarketplace";
import { ApiError } from "../../api/client";

const ASSIGNABLE = ["open", "claimed"];

export function SubcontractorTasksPage() {
  const { data: tasks, isLoading } = useSubcontractorTasks();
  const { data: workers } = useAssignableWorkers();
  const directAssign = useDirectAssign();

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [pick, setPick] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function confirmAssign(taskId: string) {
    if (!pick) return;
    setError(null);
    try {
      await directAssign.mutateAsync({ taskId, workerId: pick });
      setAssigningId(null);
      setPick("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Attribution impossible.");
    }
  }

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Markettask</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">
        Tâches de mes magasins
      </h1>
      <p className="mt-1 text-sm text-canvas-600">
        Renseigne les attentes du client et les précisions, ou attribue une tâche directement à un de
        tes travailleurs.
      </p>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {tasks && tasks.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-canvas-600">Aucune tâche dans tes magasins pour l'instant.</p>
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <div className="mt-6 space-y-3">
          {tasks.map((task) => {
            const canAssign = ASSIGNABLE.includes(task.status);
            return (
              <div key={task.id}>
                <div className="flex flex-col gap-3 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5 sm:flex-row sm:items-center sm:gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-flow-100 text-flow-700">
                    <IconTasks className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-canvas-900">
                      {task.description}
                      {task.taskType && <span className="ml-1 text-canvas-600">({task.taskType})</span>}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-canvas-600">
                      <span className="flex items-center gap-1.5">
                        <IconMapPin className="h-3 w-3 shrink-0" />
                        {task.store?.name} · {task.store?.city ?? "—"}
                      </span>
                      {task.assignedTo && (
                        <span className="flex items-center gap-1.5 text-canvas-700">
                          <IconUser className="h-3 w-3 shrink-0" />
                          {task.assignedTo.fullName ?? task.assignedTo.email}
                        </span>
                      )}
                    </p>
                  </div>
                  <TaskStatusBadge status={task.status} />
                  {canAssign && (
                    <Button
                      variant="secondary"
                      className="shrink-0"
                      onClick={() => {
                        setAssigningId(assigningId === task.id ? null : task.id);
                        setPick(task.assignedTo?.id ?? "");
                        setError(null);
                      }}
                    >
                      {assigningId === task.id
                        ? "Annuler"
                        : task.assignedTo
                          ? "Réattribuer"
                          : "Attribuer"}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    className="shrink-0"
                    onClick={() => setEditingTaskId(editingTaskId === task.id ? null : task.id)}
                  >
                    {editingTaskId === task.id ? "Fermer" : "Précisions"}
                  </Button>
                </div>

                {assigningId === task.id && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-flow-50/60 p-3">
                    <select
                      value={pick}
                      onChange={(e) => setPick(e.target.value)}
                      className="min-w-[12rem] flex-1 rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                    >
                      <option value="">— Choisir un travailleur —</option>
                      {workers?.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.fullName ?? w.email}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="accent"
                      disabled={!pick || directAssign.isPending}
                      onClick={() => confirmAssign(task.id)}
                    >
                      {directAssign.isPending ? "Attribution…" : "Attribuer"}
                    </Button>
                    {error && <p className="w-full text-xs text-red-700">{error}</p>}
                    <p className="w-full text-xs text-canvas-500">
                      Le travailleur devient responsable de la tâche sans passer par une réclamation.
                    </p>
                  </div>
                )}

                {editingTaskId === task.id && (
                  <div className="mt-2">
                    <TaskInstructionsForm taskId={task.id} onClose={() => setEditingTaskId(null)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
