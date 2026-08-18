import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { TaskStatusBadge } from "../../components/tasks/TaskStatusBadge";
import { useTasksDashboard } from "../../hooks/useTasksDashboard";
import type { TaskStatus } from "../../types";

const FILTERS: { key: TaskStatus | "all"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "claimed", label: "Réclamées" },
  { key: "in_progress", label: "En cours" },
  { key: "completed", label: "Complétées" },
  { key: "inspected", label: "Inspectées" },
];

export function TasksDashboardPage() {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const { data: tasks, isLoading } = useTasksDashboard(filter === "all" ? undefined : filter);

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Suivi des travaux</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Toutes les tâches en cours ou terminées, tous magasins confondus.
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "bg-flow-600 text-white"
                : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {tasks && tasks.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucune tâche à afficher pour ce filtre.
        </p>
      )}

      {tasks && tasks.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
                  <th className="py-2 pr-3">Magasin</th>
                  <th className="py-2 pr-3">Tâche</th>
                  <th className="py-2 pr-3">Travailleur</th>
                  <th className="py-2 pr-3">Prix</th>
                  <th className="py-2 pr-3">Échéance</th>
                  <th className="py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-canvas-100 last:border-0">
                    <td className="py-3 pr-3">
                      <Link to={`/stores/${task.storeId}`} className="text-flow-700 hover:underline">
                        {task.store?.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-3 text-canvas-900">{task.description}</td>
                    <td className="py-3 pr-3 text-canvas-700">
                      {task.assignedTo?.fullName ?? task.assignedTo?.email ?? "—"}
                    </td>
                    <td className="py-3 pr-3 font-medium text-canvas-900">{Number(task.price).toFixed(2)} $</td>
                    <td className="py-3 pr-3 text-canvas-700">{task.dueDate ? task.dueDate.slice(0, 10) : "—"}</td>
                    <td className="py-3">
                      <TaskStatusBadge status={task.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
