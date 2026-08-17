import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { IconTasks, IconMapPin } from "../../components/common/icons";
import { useMarketplaceTasks, useMyTaskClaims, useClaimTask } from "../../hooks/useMarketplace";

export function TaskMarketplacePage() {
  const { data: tasks, isLoading } = useMarketplaceTasks();
  const { data: myClaims } = useMyTaskClaims();
  const claimTask = useClaimTask();

  function claimStatusFor(taskId: string) {
    return myClaims?.find((c) => c.taskId === taskId)?.status;
  }

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Marketplace</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Tâches disponibles</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Manifeste ton intérêt pour une tâche — l'admin confirme qui l'obtient.
      </p>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {tasks && tasks.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-canvas-600">Aucune tâche disponible pour l'instant.</p>
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <div className="mt-6 space-y-3">
          {tasks.map((task) => {
            const status = claimStatusFor(task.id);
            return (
              <div
                key={task.id}
                className="flex items-center gap-4 rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-flow-100 text-flow-700">
                  <IconTasks className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-canvas-900">
                    {task.description}
                    {task.taskType && <span className="ml-1 text-canvas-600">({task.taskType})</span>}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-canvas-600">
                    <IconMapPin className="h-3 w-3 shrink-0" />
                    {task.store?.name} · {task.store?.city ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-heading font-semibold text-canvas-900">
                    {Number(task.price).toFixed(2)} $
                    {task.isNegotiable && (
                      <span className="ml-1 text-xs font-normal text-canvas-600">négociable</span>
                    )}
                  </p>
                  {task.dueDate && <p className="text-xs text-canvas-600">{task.dueDate.slice(0, 10)}</p>}
                </div>
                <div className="shrink-0">
                  {status === "pending" && (
                    <span className="inline-block rounded-full bg-linen-100 px-3 py-1 text-xs font-medium text-linen-800">
                      En attente
                    </span>
                  )}
                  {status === "rejected" && (
                    <span className="inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                      Refusée
                    </span>
                  )}
                  {!status && (
                    <Button
                      variant="accent"
                      disabled={claimTask.isPending}
                      onClick={() => claimTask.mutate(task.id)}
                    >
                      Je suis intéressé
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
