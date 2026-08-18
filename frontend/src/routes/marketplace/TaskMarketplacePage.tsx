import { useMemo, useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { IconTasks, IconMapPin, IconSearch } from "../../components/common/icons";
import { useMarketplaceTasks, useMyTaskClaims, useClaimTask } from "../../hooks/useMarketplace";

type SortKey = "recent" | "price_desc" | "price_asc";

export function TaskMarketplacePage() {
  const { data: tasks, isLoading } = useMarketplaceTasks();
  const { data: myClaims } = useMyTaskClaims();
  const claimTask = useClaimTask();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  function claimStatusFor(taskId: string) {
    return myClaims?.find((c) => c.taskId === taskId)?.status;
  }

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    const q = search.trim().toLowerCase();
    let result = tasks;
    if (q) {
      result = result.filter((task) =>
        [task.description, task.taskType, task.store?.name, task.store?.city]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(q))
      );
    }
    if (sort === "price_desc") {
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "price_asc") {
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    }
    return result;
  }, [tasks, search, sort]);

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Marketplace</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Tâches disponibles</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Manifeste ton intérêt pour une tâche — l'admin confirme qui l'obtient.
      </p>

      {tasks && tasks.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-canvas-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par tâche, magasin ou ville..."
              className="w-full rounded-lg border border-canvas-300 bg-white py-2 pl-9 pr-3 text-sm text-canvas-900 placeholder:text-canvas-600/60 focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm text-canvas-900 focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200 sm:w-56"
          >
            <option value="recent">Plus récentes</option>
            <option value="price_desc">Prix : élevé à bas</option>
            <option value="price_asc">Prix : bas à élevé</option>
          </select>
        </div>
      )}

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {tasks && tasks.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-canvas-600">Aucune tâche disponible pour l'instant.</p>
        </div>
      )}

      {tasks && tasks.length > 0 && filteredTasks.length === 0 && (
        <p className="mt-8 text-center text-sm text-canvas-600">Aucune tâche ne correspond à ta recherche.</p>
      )}

      {filteredTasks.length > 0 && (
        <div className="mt-6 space-y-3">
          {filteredTasks.map((task) => {
            const status = claimStatusFor(task.id);
            return (
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
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start sm:text-right">
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
                      className="w-full sm:w-auto"
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
