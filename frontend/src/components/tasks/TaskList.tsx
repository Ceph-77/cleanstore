import { useState } from "react";
import type { Task } from "../../types";
import { TaskStatusBadge } from "./TaskStatusBadge";

type TaskActions = {
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onPublish: (task: Task) => void;
  onUnpublish: (task: Task) => void;
  onInspect: (task: Task) => void;
  onInstructions: (task: Task) => void;
};

function TaskRow({ task, indent, ...actions }: { task: Task; indent?: boolean } & TaskActions) {
  const { onEdit, onDelete, onPublish, onUnpublish, onInspect, onInstructions } = actions;
  return (
    <tr className="border-b border-canvas-100 last:border-0">
      <td className={`py-3 pr-3 text-canvas-900 ${indent ? "pl-6 text-canvas-700" : ""}`}>
        {task.description}
        {task.taskType && <span className="ml-1 text-canvas-600">({task.taskType})</span>}
        {task.isRecurring && (
          <span
            title="Se répète chaque jour"
            className="ml-1.5 rounded-full bg-flow-100 px-1.5 py-0.5 text-[11px] font-medium text-flow-800"
          >
            ↻ quotidien
          </span>
        )}
      </td>
      <td className="py-3 pr-3">
        <span className="font-medium text-canvas-900">{Number(task.price).toFixed(2)} $</span>
        {task.isNegotiable && (
          <span className="ml-1.5 rounded-full bg-linen-100 px-1.5 py-0.5 text-[11px] font-medium text-linen-800">
            négociable
          </span>
        )}
      </td>
      <td className="py-3 pr-3 text-canvas-700">{task.dueDate ? task.dueDate.slice(0, 10) : "—"}</td>
      <td className="py-3 pr-3">
        <TaskStatusBadge status={task.status} />
      </td>
      <td className="py-3 pr-3 text-canvas-700">{task.assignedTo?.fullName ?? task.assignedTo?.email ?? "—"}</td>
      <td className="py-3 pr-3">
        {task.isPublished ? (
          <span className="inline-flex items-center rounded-full bg-flow-100 px-2.5 py-0.5 text-xs font-medium text-flow-800 ring-1 ring-inset ring-flow-200">
            Publiée
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-canvas-100 px-2.5 py-0.5 text-xs font-medium text-canvas-700 ring-1 ring-inset ring-canvas-200">
            Brouillon
          </span>
        )}
      </td>
      <td className="py-3 text-right">
        <div className="flex justify-end gap-3 text-xs font-medium">
          {task.isPublished ? (
            <button className="text-canvas-600 hover:text-canvas-900" onClick={() => onUnpublish(task)}>
              Dépublier
            </button>
          ) : (
            <button className="text-flow-700 hover:text-flow-900" onClick={() => onPublish(task)}>
              Publier
            </button>
          )}
          {task.status === "completed" && (
            <button className="text-flow-700 hover:text-flow-900" onClick={() => onInspect(task)}>
              Inspecter
            </button>
          )}
          {task.inspection && <span className="text-canvas-600">Inspectée : {task.inspection.score}/100</span>}
          <button className="text-flow-700 hover:text-flow-900" onClick={() => onInstructions(task)}>
            Précisions
          </button>
          <button className="text-flow-700 hover:text-flow-900" onClick={() => onEdit(task)}>
            Modifier
          </button>
          <button className="text-red-600 hover:text-red-800" onClick={() => onDelete(task)}>
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * Une tâche récurrente (isRecurring) + toutes ses instances quotidiennes
 * générées (recurringParentId === parent.id) — repliées sous une seule ligne
 * par défaut. Les instances ne sont jamais supprimées ([[feedback_preserve_past_tasks]]),
 * juste masquées visuellement tant que personne ne demande à voir l'historique.
 */
function RecurringGroup({ parent, instances, ...actions }: { parent: Task; instances: Task[] } & TaskActions) {
  const [expanded, setExpanded] = useState(false);
  const openCount = instances.filter((t) => t.status === "open" || t.status === "claimed" || t.status === "in_progress").length;

  return (
    <>
      <TaskRow task={parent} {...actions} />
      {instances.length > 0 && (
        <tr className="border-b border-canvas-100 bg-canvas-50/60 last:border-0">
          <td colSpan={7} className="py-2 pl-6 pr-3">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-medium text-flow-700 hover:text-flow-900"
            >
              {expanded ? "▾ Masquer l'historique" : "▸ Historique"} ({instances.length} occurrence
              {instances.length === 1 ? "" : "s"}
              {openCount > 0 ? `, ${openCount} en cours` : ""})
            </button>
          </td>
        </tr>
      )}
      {expanded && instances.map((t) => <TaskRow key={t.id} task={t} indent {...actions} />)}
    </>
  );
}

export function TaskList({ tasks, ...actions }: { tasks: Task[] } & TaskActions) {
  if (tasks.length === 0) {
    return <p className="py-4 text-sm text-canvas-600">Aucune tâche pour ce magasin pour l'instant.</p>;
  }

  const parents = tasks.filter((t) => t.isRecurring);
  const parentIds = new Set(parents.map((t) => t.id));
  const instancesByParent = new Map<string, Task[]>();
  const standalone: Task[] = [];

  for (const t of tasks) {
    if (t.isRecurring) continue;
    if (t.recurringParentId && parentIds.has(t.recurringParentId)) {
      const list = instancesByParent.get(t.recurringParentId);
      if (list) list.push(t);
      else instancesByParent.set(t.recurringParentId, [t]);
    } else {
      standalone.push(t);
    }
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
          <th className="py-2 pr-3">Description</th>
          <th className="py-2 pr-3">Prix</th>
          <th className="py-2 pr-3">Échéance</th>
          <th className="py-2 pr-3">Statut</th>
          <th className="py-2 pr-3">Travailleur</th>
          <th className="py-2 pr-3">Markettask</th>
          <th className="py-2"></th>
        </tr>
      </thead>
      <tbody>
        {parents.map((parent) => (
          <RecurringGroup key={parent.id} parent={parent} instances={instancesByParent.get(parent.id) ?? []} {...actions} />
        ))}
        {standalone.map((task) => (
          <TaskRow key={task.id} task={task} {...actions} />
        ))}
      </tbody>
    </table>
  );
}
