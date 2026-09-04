import { useRef, useState, type FormEvent } from "react";
import { Field } from "../common/Field";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { ApiError } from "../../api/client";
import type { Task } from "../../types";

export function TaskInspectionForm({
  task,
  onSubmit,
  onCancel,
  submitting,
  initial,
}: {
  task: Task;
  onSubmit: (values: {
    data: { score: number; notes: string };
    photosBefore: File[];
    photosAfter: File[];
  }) => Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
  initial?: { score: number; notes: string };
}) {
  const isEdit = !!initial;
  const [score, setScore] = useState(initial ? String(initial.score) : "100");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        data: { score: Number(score), notes },
        photosBefore: beforeInputRef.current?.files ? Array.from(beforeInputRef.current.files) : [],
        photosAfter: afterInputRef.current?.files ? Array.from(afterInputRef.current.files) : [],
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de l'enregistrement de l'inspection");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-flow-200 bg-flow-50/60 p-5"
    >
      <p className="text-sm text-canvas-700">
        Inspection de : <span className="font-medium text-canvas-900">{task.description}</span>
      </p>
      {task.workerNote && (
        <div className="rounded-xl border border-linen-300 bg-linen-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-linen-800">Remarque du travailleur</p>
          <p className="mt-1 whitespace-pre-line text-sm text-canvas-900">{task.workerNote}</p>
        </div>
      )}
      <Field label="Score (0-100)">
        <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
      </Field>
      <Field label="Note">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
        />
      </Field>
      {!isEdit && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Photos avant">
            <input ref={beforeInputRef} type="file" multiple accept="image/*" className="text-sm" />
          </Field>
          <Field label="Photos après">
            <input ref={afterInputRef} type="file" multiple accept="image/*" className="text-sm" />
          </Field>
        </div>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="accent" disabled={submitting}>
          {submitting ? "Enregistrement..." : isEdit ? "Mettre à jour l'inspection" : "Enregistrer l'inspection"}
        </Button>
      </div>
    </form>
  );
}
