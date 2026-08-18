import { useState, type FormEvent } from "react";
import { Field } from "../common/Field";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import type { Task, TaskStatus } from "../../types";

export interface TaskFormValues {
  description: string;
  taskType: string;
  price: string;
  isNegotiable: boolean;
  dueDate: string;
  status: TaskStatus;
}

export function TaskForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<Task>;
  onSubmit: (values: TaskFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<TaskFormValues>({
    description: initial?.description ?? "",
    taskType: initial?.taskType ?? "",
    price: initial?.price ?? "",
    isNegotiable: initial?.isNegotiable ?? false,
    dueDate: initial?.dueDate?.slice(0, 10) ?? "",
    status: initial?.status ?? "open",
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-flow-200 bg-flow-50/60 p-5"
    >
      <Field label="Description">
        <Input
          required
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          placeholder="ex: laver planchers"
        />
      </Field>
      <Field label="Type de tâche">
        <Input
          value={values.taskType}
          onChange={(e) => setValues({ ...values, taskType: e.target.value })}
          placeholder="ex: entretien général"
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prix ($)">
          <Input
            required
            type="number"
            step="0.01"
            min="0"
            value={values.price}
            onChange={(e) => setValues({ ...values, price: e.target.value })}
          />
        </Field>
        <Field label="Échéance">
          <Input
            type="date"
            value={values.dueDate}
            onChange={(e) => setValues({ ...values, dueDate: e.target.value })}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm text-canvas-800">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-canvas-300 text-flow-600 focus:ring-flow-400"
          checked={values.isNegotiable}
          onChange={(e) => setValues({ ...values, isNegotiable: e.target.checked })}
        />
        Prix négociable
      </label>
      <Field label="Statut">
        <select
          className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
          value={values.status}
          onChange={(e) => setValues({ ...values, status: e.target.value as TaskStatus })}
        >
          <option value="open">Ouverte</option>
          <option value="claimed">Réclamée</option>
          <option value="completed">Complétée</option>
          <option value="inspected">Inspectée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}
