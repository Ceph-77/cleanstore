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
import { TaskInstructionsForm } from "../../tasks/TaskInstructionsForm";
import { Button } from "../../common/Button";
import { StatCard } from "../../common/StatCard";
import { IconTasks, IconWallet } from "../../common/icons";
import {
  useCreateTaskInspection,
  useUpdateTaskInspection,
  useTaskInspection,
} from "../../../hooks/useTaskInspections";
import { StoreGeofenceCard } from "../StoreGeofenceCard";
import { useTaskTemplates, useInstantiateTemplates } from "../../../hooks/useTaskTemplates";
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
  const updateInspection = useUpdateTaskInspection(store.id);

  const { data: templates } = useTaskTemplates();
  const instantiate = useInstantiateTemplates(store.id);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pickedTemplateIds, setPickedTemplateIds] = useState<string[]>([]);
  const [variantByTemplate, setVariantByTemplate] = useState<Record<string, string>>({});

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [inspectingTask, setInspectingTask] = useState<Task | null>(null);
  const { data: existingInspection } = useTaskInspection(inspectingTask?.id ?? "");
  const [instructionsTaskId, setInstructionsTaskId] = useState<string | null>(null);

  async function handleTaskSubmit(values: TaskFormValues) {
    const payload = {
      description: values.description,
      taskType: values.taskType || undefined,
      price: values.price,
      isNegotiable: values.isNegotiable,
      dueDate: values.dueDate || undefined,
      status: values.status,
      isRecurring: values.isRecurring,
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

      <StoreGeofenceCard store={store} />

      <div className="mt-10 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold text-canvas-900">Tâches</h2>
        <div className="flex gap-2">
          {templates && templates.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                setPickedTemplateIds([]);
                setShowTemplatePicker((v) => !v);
              }}
            >
              + depuis un modèle
            </Button>
          )}
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
      </div>

      {showTemplatePicker && templates && (
        <div className="mt-4 space-y-3 rounded-2xl border border-flow-200 bg-flow-50/60 p-5">
          <p className="text-sm text-canvas-700">
            Coche les modèles à ajouter. Les tâches sont créées <strong>non publiées</strong> — ajuste
            le prix, la cible et les précisions, puis publie.
          </p>
          <div className="space-y-2">
            {templates.map((t) => {
              const picked = pickedTemplateIds.includes(t.id);
              return (
                <div key={t.id}>
                  <label className="flex items-start gap-2 text-sm text-canvas-800">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={picked}
                      onChange={(e) =>
                        setPickedTemplateIds((ids) =>
                          e.target.checked ? [...ids, t.id] : ids.filter((id) => id !== t.id)
                        )
                      }
                    />
                    <span>
                      <span className="font-medium">{t.name}</span>
                      {t.metricLabel && (
                        <span className="text-canvas-600">
                          {" "}
                          — cible {t.defaultMetricTarget ?? "?"} {t.metricUnit ?? ""}
                        </span>
                      )}
                    </span>
                  </label>
                  {picked && t.variants.length > 0 && (
                    <select
                      className="ml-6 mt-1 rounded-lg border border-canvas-300 bg-white px-2 py-1 text-xs"
                      value={variantByTemplate[t.id] ?? ""}
                      onChange={(e) =>
                        setVariantByTemplate((m) => ({ ...m, [t.id]: e.target.value }))
                      }
                    >
                      <option value="">Variante par défaut</option>
                      {t.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                          {v.price != null ? ` — ${Number(v.price)} $` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowTemplatePicker(false)}>
              Annuler
            </Button>
            <Button
              variant="accent"
              disabled={pickedTemplateIds.length === 0 || instantiate.isPending}
              onClick={async () => {
                const vbt = Object.fromEntries(
                  Object.entries(variantByTemplate).filter(
                    ([id, v]) => v && pickedTemplateIds.includes(id)
                  )
                );
                await instantiate.mutateAsync({ templateIds: pickedTemplateIds, variantByTemplate: vbt });
                setShowTemplatePicker(false);
              }}
            >
              {instantiate.isPending ? "..." : `Créer ${pickedTemplateIds.length} tâche(s)`}
            </Button>
          </div>
        </div>
      )}

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
            initial={
              existingInspection
                ? {
                    score: existingInspection.score,
                    notes: existingInspection.notes ?? "",
                    correctedMetricValue:
                      existingInspection.correctedMetricValue != null
                        ? Number(existingInspection.correctedMetricValue)
                        : undefined,
                  }
                : undefined
            }
            submitting={createInspection.isPending || updateInspection.isPending}
            onCancel={() => setInspectingTask(null)}
            onSubmit={async (values) => {
              if (existingInspection) {
                await updateInspection.mutateAsync({ taskId: inspectingTask.id, data: values.data });
              } else {
                await createInspection.mutateAsync({ taskId: inspectingTask.id, ...values });
              }
              setInspectingTask(null);
            }}
          />
        </div>
      )}

      {instructionsTaskId && (
        <div className="mt-4">
          <TaskInstructionsForm taskId={instructionsTaskId} onClose={() => setInstructionsTaskId(null)} />
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
            onInstructions={(task) => setInstructionsTaskId(task.id)}
          />
        </div>
      </div>
    </div>
  );
}
