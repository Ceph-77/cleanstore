import { useMemo, useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { IconTasks, IconMapPin, IconSearch, IconFile } from "../../components/common/icons";
import { useMarketplaceTasks, useMyTaskClaims, useClaimTask } from "../../hooks/useMarketplace";
import type { Task } from "../../types";

type SortKey = "recent" | "price_desc" | "price_asc" | "store_asc" | "due_date";

function ExpectedResultPreview({ task }: { task: Task }) {
  return (
    <div className="mt-2 rounded-2xl bg-flow-50/60 p-4 ring-1 ring-flow-100">
      {task.expectedResultText && (
        <p className="whitespace-pre-line text-sm text-canvas-900">{task.expectedResultText}</p>
      )}
      {task.expectedPhotos && task.expectedPhotos.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {task.expectedPhotos.map((photo) => (
            <a
              key={photo.id}
              href={photo.downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-canvas-700 ring-1 ring-canvas-200 hover:bg-canvas-100"
            >
              <IconFile className="h-3 w-3" />
              {photo.fileName}
            </a>
          ))}
        </div>
      )}
      {task.requiredEquipment.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {task.requiredEquipment.map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-2 py-0.5 text-xs text-canvas-700 ring-1 ring-canvas-200"
            >
              {item}
            </span>
          ))}
        </div>
      )}
      {task.estimatedDurationMinutes && (
        <p className="mt-2 text-xs text-canvas-600">Durée estimée : ~{task.estimatedDurationMinutes} min</p>
      )}
    </div>
  );
}

export function TaskMarketplacePage() {
  const { data: tasks, isLoading } = useMarketplaceTasks();
  const { data: myClaims } = useMyTaskClaims();
  const claimTask = useClaimTask();

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  function claimFor(taskId: string) {
    return myClaims?.find((c) => c.taskId === taskId);
  }

  async function handleConfirmClaim(taskId: string) {
    await claimTask.mutateAsync({ taskId, note: note.trim() || undefined });
    setClaimingTaskId(null);
    setNote("");
  }

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
    } else if (sort === "store_asc") {
      result = [...result].sort((a, b) =>
        (a.store?.name ?? "").localeCompare(b.store?.name ?? "") ||
        (a.store?.city ?? "").localeCompare(b.store?.city ?? "")
      );
    } else if (sort === "due_date") {
      result = [...result].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    }
    return result;
  }, [tasks, search, sort]);

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Markettask</p>
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
            <option value="store_asc">Magasin / Ville (A-Z)</option>
            <option value="due_date">Échéance (plus proche)</option>
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
            const claim = claimFor(task.id);
            const hasPreview =
              Boolean(task.expectedResultText) ||
              (task.expectedPhotos?.length ?? 0) > 0 ||
              task.requiredEquipment.length > 0 ||
              Boolean(task.estimatedDurationMinutes);
            const isExpanded = expandedTaskId === task.id;
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
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-canvas-600">
                      <IconMapPin className="h-3 w-3 shrink-0" />
                      {task.store?.name} · {task.store?.city ?? "—"}
                    </p>
                    {hasPreview && (
                      <button
                        type="button"
                        onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                        className="mt-1 text-xs font-medium text-flow-700 hover:text-flow-900"
                      >
                        {isExpanded ? "Masquer le résultat attendu" : "Voir le résultat attendu"}
                      </button>
                    )}
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
                  <div className="shrink-0 text-right">
                    {status === "pending" && (
                      <span className="inline-block rounded-full bg-linen-100 px-3 py-1 text-xs font-medium text-linen-800">
                        En attente
                      </span>
                    )}
                    {status === "rejected" && (
                      <>
                        <span className="inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                          Refusée
                        </span>
                        {claim?.decisionReason && (
                          <p className="mt-1 max-w-[16rem] text-xs text-canvas-600">{claim.decisionReason}</p>
                        )}
                      </>
                    )}
                    {!status && claimingTaskId !== task.id && (
                      <Button
                        variant="accent"
                        className="w-full sm:w-auto"
                        onClick={() => setClaimingTaskId(task.id)}
                      >
                        Je suis intéressé
                      </Button>
                    )}
                  </div>
                </div>
                {claimingTaskId === task.id && (
                  <div className="mt-2 space-y-2 rounded-xl bg-flow-50/60 p-3">
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Ajouter un message (optionnel) — ex: ta disponibilité, ton expérience"
                      className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setClaimingTaskId(null);
                          setNote("");
                        }}
                      >
                        Annuler
                      </Button>
                      <Button variant="accent" disabled={claimTask.isPending} onClick={() => handleConfirmClaim(task.id)}>
                        {claimTask.isPending ? "Envoi..." : "Confirmer"}
                      </Button>
                    </div>
                  </div>
                )}
                {isExpanded && <ExpectedResultPreview task={task} />}
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
