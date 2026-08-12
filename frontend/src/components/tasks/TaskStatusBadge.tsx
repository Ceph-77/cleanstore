import type { TaskStatus } from "../../types";

const STATUS_LABELS: Record<TaskStatus, string> = {
  open: "Ouverte",
  claimed: "Réclamée",
  completed: "Complétée",
  inspected: "Inspectée",
  cancelled: "Annulée",
};

const STATUS_CLASSES: Record<TaskStatus, string> = {
  open: "bg-canvas-100 text-canvas-700 ring-canvas-200",
  claimed: "bg-linen-100 text-linen-800 ring-linen-200",
  completed: "bg-flow-100 text-flow-800 ring-flow-200",
  inspected: "bg-flow-600 text-white ring-flow-700",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
