import type { Task } from "../../types";
import { TaskStatusBadge } from "./TaskStatusBadge";

export function TaskList({
  tasks,
  onEdit,
  onDelete,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return <p className="text-sm text-gray-500">Aucune tâche pour ce magasin pour l'instant.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 text-left text-gray-500">
          <th className="py-2 pr-3 font-medium">Description</th>
          <th className="py-2 pr-3 font-medium">Prix</th>
          <th className="py-2 pr-3 font-medium">Échéance</th>
          <th className="py-2 pr-3 font-medium">Statut</th>
          <th className="py-2 font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => (
          <tr key={task.id} className="border-b border-gray-100">
            <td className="py-2 pr-3">
              {task.description}
              {task.taskType && <span className="ml-1 text-gray-400">({task.taskType})</span>}
            </td>
            <td className="py-2 pr-3">
              {Number(task.price).toFixed(2)} $
              {task.isNegotiable && <span className="ml-1 text-xs text-gray-400">négociable</span>}
            </td>
            <td className="py-2 pr-3">{task.dueDate ? task.dueDate.slice(0, 10) : "—"}</td>
            <td className="py-2 pr-3">
              <TaskStatusBadge status={task.status} />
            </td>
            <td className="py-2 text-right">
              <div className="flex justify-end gap-2">
                <button className="text-blue-600 hover:underline" onClick={() => onEdit(task)}>
                  Modifier
                </button>
                <button className="text-red-600 hover:underline" onClick={() => onDelete(task)}>
                  Supprimer
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
