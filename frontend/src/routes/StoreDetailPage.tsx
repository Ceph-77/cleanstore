import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../components/common/AppLayout";
import { useStore } from "../hooks/useStores";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "../hooks/useTasks";
import { TaskList } from "../components/tasks/TaskList";
import { TaskForm, type TaskFormValues } from "../components/tasks/TaskForm";
import { Button } from "../components/common/Button";
import { StatCard } from "../components/common/StatCard";
import { IconStore, IconTasks, IconWallet } from "../components/common/icons";
import type { Task } from "../types";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-canvas-600">{label}</p>
      <p className="mt-0.5 text-sm text-canvas-900">{value}</p>
    </div>
  );
}

export function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const storeId = id!;
  const { data: store, isLoading } = useStore(storeId);
  const { data: tasks } = useTasks(storeId);
  const createTask = useCreateTask(storeId);
  const updateTask = useUpdateTask(storeId);
  const deleteTask = useDeleteTask(storeId);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  if (isLoading || !store) {
    return (
      <AppLayout>
        <p className="text-sm text-canvas-600">Chargement...</p>
      </AppLayout>
    );
  }

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
    <AppLayout>
      <Link to="/stores" className="text-sm text-flow-700 hover:text-flow-900">
        ← Tous les magasins
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-flow-100 text-flow-700">
          <IconStore className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">{store.name}</h1>
          {store.banner && (
            <span className="mt-0.5 inline-block rounded-full bg-linen-100 px-2 py-0.5 text-xs font-medium text-linen-800">
              {store.banner}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5 sm:grid-cols-3">
        <InfoItem label="Adresse" value={[store.address, store.city].filter(Boolean).join(", ") || "—"} />
        <InfoItem label="Gérant" value={store.storeManagerName ?? "—"} />
        <InfoItem label="Fréquence" value={store.cleaningFrequency ?? "—"} />
        <InfoItem label="Grande compagnie" value={store.grandeCompagnie?.name ?? "—"} />
        <InfoItem label="Sous-traitant" value={store.assignedSubcontractor?.name ?? "—"} />
        <InfoItem label="Superficie" value={store.squareFootage ? `${store.squareFootage} pi²` : "—"} />
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

      <div className="mt-4 overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
        <div className="p-5">
          <TaskList
            tasks={tasks ?? []}
            onEdit={(task) => {
              setEditingTask(task);
              setShowForm(true);
            }}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </AppLayout>
  );
}
