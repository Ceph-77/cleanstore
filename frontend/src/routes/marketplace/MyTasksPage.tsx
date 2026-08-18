import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { TaskStatusBadge } from "../../components/tasks/TaskStatusBadge";
import { IconTasks, IconMapPin } from "../../components/common/icons";
import { useMyTasks, useUpdateMyTaskStatus } from "../../hooks/useMyTasks";

export function MyTasksPage() {
  const { data: tasks, isLoading } = useMyTasks();
  const updateStatus = useUpdateMyTaskStatus();

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
            <div
              key={task.id}
              className="flex flex-col gap-3 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5 sm:flex-row sm:items-center sm:gap-4"
            >
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
                {task.status === "in_progress" && (
                  <Button
                    variant="accent"
                    className="w-full sm:w-auto"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ taskId: task.id, status: "completed" })}
                  >
                    Marquer complétée
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
