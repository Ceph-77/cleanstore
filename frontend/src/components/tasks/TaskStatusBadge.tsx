import type { TaskStatus } from "../../types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Ouverte",
  claimed: "Réclamée",
  completed: "Complétée",
  inspected: "Inspectée",
  cancelled: "Annulée",
};

const STATUS_CLASSES: Record<TaskStatus, string> = {
  open: "bg-gray-100 text-gray-700",
  claimed: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  inspected: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
