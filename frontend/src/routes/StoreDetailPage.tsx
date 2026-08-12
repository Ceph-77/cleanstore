import { useState } from "react";
import { useParams } from "react-router-dom";
import { AppLayout } from "../components/common/AppLayout";
import { useStore } from "../hooks/useStores";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "../hooks/useTasks";
import { TaskList } from "../components/tasks/TaskList";
import { TaskForm, type TaskFormValues } from "../components/tasks/TaskForm";
import { Button } from "../components/common/Button";
import type { Task } from "../types";

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
        <p className="text-sm text-gray-500">Chargement...</p>
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

  return (
    <AppLayout>
      <h1 className="text-xl font-semibold text-gray-900">{store.name}</h1>
      <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
        <p>Bannière : {store.banner ?? "—"}</p>
        <p>Adresse : {store.address ?? "—"}, {store.city ?? ""}</p>
        <p>Gérant : {store.storeManagerName ?? "—"}</p>
        <p>Fréquence : {store.cleaningFrequency ?? "—"}</p>
        <p>Grande compagnie : {store.grandeCompagnie?.name ?? "—"}</p>
        <p>Sous-traitant : {store.assignedSubcontractor?.name ?? "—"}</p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tâches</h2>
        <Button
          onClick={() => {
            setEditingTask(null);
            setShowForm(true);
          }}
        >
          Ajouter une tâche
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

      <div className="mt-4">
        <TaskList
          tasks={tasks ?? []}
          onEdit={(task) => {
            setEditingTask(task);
            setShowForm(true);
          }}
          onDelete={handleDelete}
        />
      </div>
    </AppLayout>
  );
}
