import { useState } from "react";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  usePublishTask,
  useUnpublishTask,
} from "../../../hooks/useTasks";
import { TaskList } from "../../tasks/TaskList";
import { TaskForm, type TaskFormValues } from "../../tasks/TaskForm";
import { TaskInspectionForm } from "../../tasks/TaskInspectionForm";
import { Button } from "../../common/Button";
import { StatCard } from "../../common/StatCard";
import { IconTasks, IconWallet } from "../../common/icons";
import { useCreateTaskInspection } from "../../../hooks/useTaskInspections";
import type { Store, Task } from "../../../types";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-canvas-600">{label}</p>
      <p className="mt-0.5 whitespace-pre-line text-sm text-canvas-900">{value}</p>
    </div>
  );
}

export function OverviewTab({ store }: { store: Store }) {
  const { data: tasks } = useTasks(store.id);
  const createTask = useCreateTask(store.id);
  const updateTask = useUpdateTask(store.id);
  const deleteTask = useDeleteTask(store.id);
  const publishTask = usePublishTask(store.id);
  const unpublishTask = useUnpublishTask(store.id);
  const createInspection = useCreateTaskInspection(store.id);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [inspectingTask, setInspectingTask] = useState<Task | null>(null);

  async function handleTaskSubmit(values: TaskFormValues) {
    const payload = {
      description: values.description,
      taskType: values.taskType || undefined,
      price: values.price,
      isNegotiable: values.isNegotiable,
      dueDate: values.dueDate || undefined,
      status: values.status,
    };
    if (editingTask) {
      await updateTask.mutateAsync({ id: editingTask.id, data: payload });
    } else {
      await createTask.mutateAsync(payload);
    }
    setShowForm(false);
    setEditingTask(null);
  }

  async function handleDelete(task: Task) {
    if (confirm(`Supprimer la tâche "${task.description}" ?`)) {
      await deleteTask.mutateAsync(task.id);
    }
  }

  const openTasks = (tasks ?? []).filter((t) => t.status === "open");
  const totalValue = (tasks ?? []).reduce((sum, t) => sum + Number(t.price), 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5 sm:grid-cols-3">
        <InfoItem label="Adresse" value={[store.address, store.city].filter(Boolean).join(", ") || "—"} />
        <InfoItem label="Gérant" value={store.storeManagerName ?? "—"} />
        <InfoItem label="Fréquence" value={store.cleaningFrequency ?? "—"} />
        <InfoItem label="Grande compagnie" value={store.grandeCompagnie?.name ?? "—"} />
        <InfoItem label="Sous-traitant" value={store.assignedSubcontractor?.name ?? "—"} />
        <InfoItem label="Superficie" value={store.squareFootage ? `${store.squareFootage} pi²` : "—"} />
        <InfoItem label="Horaires du magasin" value={store.storeHours ?? "—"} />
        <InfoItem label="Accès et sécurité" value={store.securityAccessInfo ?? "—"} />
        <InfoItem label="Exigences spéciales" value={store.specialRequirements ?? "—"} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Tâches ouvertes" value={openTasks.length} icon={<IconTasks />} accent="flow" />
        <StatCard label="Valeur totale des tâches" value={`${totalValue.toFixed(2)} $`} icon={<IconWallet />} accent="linen" />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-canvas-900">Tâches</h2>
        <Button
          variant="accent"
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
        >
          + Ajouter une tâche
        </Button>
      </div>

      {showForm && (
        <div className="mt-4">
          <TaskForm
            initial={editingTask ?? undefined}
            submitting={createTask.isPending || updateTask.isPending}
            onCancel={() => {
              setShowForm(false);
              setEditingTask(null);
            }}
            onSubmit={handleTaskSubmit}
          />
        </div>
      )}

      {inspectingTask && (
        <div className="mt-4">
          <TaskInspectionForm
            task={inspectingTask}
            submitting={createInspection.isPending}
            onCancel={() => setInspectingTask(null)}
            onSubmit={async (values) => {
              await createInspection.mutateAsync({ taskId: inspectingTask.id, ...values });
              setInspectingTask(null);
            }}
          />
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
        <div className="overflow-x-auto p-5">
          <TaskList
            tasks={tasks ?? []}
            onEdit={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onDelete={handleDelete}
            onPublish={(task) => publishTask.mutate(task.id)}
            onUnpublish={(task) => unpublishTask.mutate(task.id)}
            onInspect={(task) => setInspectingTask(task)}
          />
        </div>
      </div>
    </div>
  );
}
