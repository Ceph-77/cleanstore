import { useEffect, useRef, useState, type FormEvent } from "react";
import { Field } from "../common/Field";
import { Input } from "../common/Input";
import { Button } from "../common/Button";
import { IconFile } from "../common/icons";
import {
  useTaskInstructions,
  useUpdateTaskInstructions,
  useUploadExpectedPhotos,
  useDeleteExpectedPhoto,
  useAddStep,
  useDeleteStep,
} from "../../hooks/useTaskInstructions";

const textareaClass =
  "w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200";

export function TaskInstructionsForm({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { data: task, isLoading } = useTaskInstructions(taskId);
  const updateInstructions = useUpdateTaskInstructions(taskId);
  const uploadPhotos = useUploadExpectedPhotos(taskId);
  const deletePhoto = useDeleteExpectedPhoto(taskId);
  const addStep = useAddStep(taskId);
  const deleteStep = useDeleteStep(taskId);

  const [expectedResultText, setExpectedResultText] = useState("");
  const [howToText, setHowToText] = useState("");
  const [requiredEquipment, setRequiredEquipment] = useState("");
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState("");
  const [newStepText, setNewStepText] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setExpectedResultText(task.expectedResultText ?? "");
      setHowToText(task.howToText ?? "");
      setRequiredEquipment(task.requiredEquipment.join(", "));
      setEstimatedDurationMinutes(task.estimatedDurationMinutes?.toString() ?? "");
    }
  }, [task]);

  async function handleSaveText(e: FormEvent) {
    e.preventDefault();
    await updateInstructions.mutateAsync({
      expectedResultText: expectedResultText || undefined,
      howToText: howToText || undefined,
      requiredEquipment: requiredEquipment
        ? requiredEquipment.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      estimatedDurationMinutes: estimatedDurationMinutes ? Number(estimatedDurationMinutes) : undefined,
    });
  }

  async function handlePhotoChange() {
    const files = photoInputRef.current?.files;
    if (files && files.length > 0) {
      await uploadPhotos.mutateAsync(Array.from(files));
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  async function handleAddStep(e: FormEvent) {
    e.preventDefault();
    if (!newStepText.trim()) return;
    await addStep.mutateAsync(newStepText.trim());
    setNewStepText("");
  }

  if (isLoading || !task) {
    return (
      <div className="rounded-2xl border border-flow-200 bg-flow-50/60 p-5">
        <p className="text-sm text-canvas-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-flow-200 bg-flow-50/60 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-canvas-700">
          Instructions pour : <span className="font-medium text-canvas-900">{task.description}</span>
        </p>
        <Button type="button" variant="secondary" onClick={onClose}>
          Fermer
        </Button>
      </div>

      <form onSubmit={handleSaveText} className="space-y-4">
        <Field label="Résultat attendu (visible avant réclamation)">
          <textarea
            value={expectedResultText}
            onChange={(e) => setExpectedResultText(e.target.value)}
            rows={3}
            placeholder="ex: planchers secs et sans traces, poubelles vidées"
            className={textareaClass}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Produits/équipement requis (séparés par virgule)">
            <Input
              value={requiredEquipment}
              onChange={(e) => setRequiredEquipment(e.target.value)}
              placeholder="nettoyant à vitres, aspirateur industriel"
            />
          </Field>
          <Field label="Durée estimée (minutes)">
            <Input
              type="number"
              min="1"
              value={estimatedDurationMinutes}
              onChange={(e) => setEstimatedDurationMinutes(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Comment faire (visible seulement après réclamation)">
          <textarea
            value={howToText}
            onChange={(e) => setHowToText(e.target.value)}
            rows={4}
            placeholder="Étapes générales, précautions, produits à ne pas mélanger..."
            className={textareaClass}
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" variant="accent" disabled={updateInstructions.isPending}>
            {updateInstructions.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-canvas-600">
          Photos du résultat attendu
        </p>
        {task.expectedPhotos && task.expectedPhotos.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {task.expectedPhotos.map((photo) => (
              <div
                key={photo.id}
                className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-canvas-700 ring-1 ring-canvas-200"
              >
                <a
                  href={photo.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-flow-700"
                >
                  <IconFile className="h-3 w-3" />
                  {photo.fileName}
                </a>
                <button
                  type="button"
                  onClick={() => deletePhoto.mutate(photo.id)}
                  className="text-canvas-600 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={photoInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handlePhotoChange}
          className="text-sm"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-canvas-600">
          Étapes (visibles seulement après réclamation)
        </p>
        {task.steps && task.steps.length > 0 && (
          <ul className="mb-2 space-y-1">
            {task.steps.map((step) => (
              <li
                key={step.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm text-canvas-900 ring-1 ring-canvas-200"
              >
                <span>
                  {step.order}. {step.text}
                </span>
                <button
                  type="button"
                  onClick={() => deleteStep.mutate(step.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={handleAddStep} className="flex gap-2">
          <Input
            value={newStepText}
            onChange={(e) => setNewStepText(e.target.value)}
            placeholder="Nouvelle étape"
          />
          <Button type="submit" variant="secondary" disabled={addStep.isPending}>
            Ajouter
          </Button>
        </form>
      </div>
    </div>
  );
}
