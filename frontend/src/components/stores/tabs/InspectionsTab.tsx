import { useRef, useState, type FormEvent } from "react";
import {
  useStoreInspections,
  useCreateStoreInspection,
  useUpdateStoreInspection,
} from "../../../hooks/useStoreInspections";
import { Button } from "../../common/Button";
import { Field } from "../../common/Field";
import { Input } from "../../common/Input";
import { IconInspection, IconFile } from "../../common/icons";
import { ApiError } from "../../../api/client";
import type { ChecklistItem, Store } from "../../../types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-flow-100 text-flow-800 ring-flow-200";
  if (score >= 50) return "bg-linen-100 text-linen-800 ring-linen-200";
  return "bg-red-50 text-red-700 ring-red-200";
}

export function InspectionsTab({ store }: { store: Store }) {
  const { data: inspections } = useStoreInspections(store.id);
  const createInspection = useCreateStoreInspection(store.id);
  const updateInspection = useUpdateStoreInspection(store.id);

  const [editId, setEditId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState("100");
  const [notes, setNotes] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    store.zones.map((zone) => ({ zone, item: "Propreté générale", passed: true }))
  );
  const [error, setError] = useState<string | null>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  function toggleZone(zone: string) {
    setChecklist((c) => c.map((item) => (item.zone === zone ? { ...item, passed: !item.passed } : item)));
  }

  function resetForm() {
    setScore("100");
    setNotes("");
    setChecklist(store.zones.map((zone) => ({ zone, item: "Propreté générale", passed: true })));
    if (beforeInputRef.current) beforeInputRef.current.value = "";
    if (afterInputRef.current) afterInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createInspection.mutateAsync({
        data: { score: Number(score), notes, checklist },
        photosBefore: beforeInputRef.current?.files ? Array.from(beforeInputRef.current.files) : [],
        photosAfter: afterInputRef.current?.files ? Array.from(afterInputRef.current.files) : [],
      });
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Échec de l'enregistrement de l'inspection");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-canvas-900">Inspections</h2>
        <Button variant="accent" onClick={() => setShowForm((v) => !v)}>
          + Nouvelle inspection
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-2xl border border-flow-200 bg-flow-50/60 p-5"
        >
          {store.zones.length === 0 && (
            <p className="text-sm text-canvas-600">
              Aucune zone définie pour ce magasin — ajoute des zones dans « Caractéristiques physiques » (onglet
              Modifier) pour générer une checklist.
            </p>
          )}
          {store.zones.length > 0 && (
            <div>
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-canvas-600">
                Checklist par zone
              </span>
              <div className="space-y-2">
                {checklist.map((item) => (
                  <label
                    key={item.zone}
                    className="flex items-center justify-between rounded-lg border border-canvas-200 bg-white px-3 py-2"
                  >
                    <span className="text-sm text-canvas-900">{item.zone}</span>
                    <span className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.passed}
                        onChange={() => toggleZone(item.zone)}
                        className="h-4 w-4 rounded border-canvas-300 text-flow-600 focus:ring-flow-400"
                      />
                      {item.passed ? "Réussi" : "Échoué"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-[10rem]">
            <Field label="Score (0-100)">
              <Input type="number" min={0} max={100} value={score} onChange={(e) => setScore(e.target.value)} />
            </Field>
          </div>

          <Field label="Note">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Photos avant">
              <input ref={beforeInputRef} type="file" multiple accept="image/*" className="text-sm" />
            </Field>
            <Field label="Photos après">
              <input ref={afterInputRef} type="file" multiple accept="image/*" className="text-sm" />
            </Field>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="accent" disabled={createInspection.isPending}>
              {createInspection.isPending ? "Enregistrement..." : "Enregistrer l'inspection"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {inspections && inspections.length === 0 && (
          <p className="rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-10 text-center text-sm text-canvas-600">
            Aucune inspection enregistrée pour ce magasin.
          </p>
        )}
        {inspections?.map((inspection) => {
          const passedCount = inspection.checklist.filter((c) => c.passed).length;
          return (
            <div
              key={inspection.id}
              className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flow-100 text-flow-700 [&>svg]:h-4 [&>svg]:w-4">
                    <IconInspection />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-canvas-900">{formatDateTime(inspection.createdAt)}</p>
                    {inspection.checklist.length > 0 && (
                      <p className="text-xs text-canvas-600">
                        {passedCount}/{inspection.checklist.length} zones réussies
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${scoreColor(inspection.score)}`}
                  >
                    {inspection.score}/100
                  </span>
                  {editId !== inspection.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(inspection.id);
                        setEditScore(String(inspection.score));
                        setEditNotes(inspection.notes ?? "");
                      }}
                      className="text-xs font-medium text-flow-700 hover:text-flow-900"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </div>

              {editId === inspection.id ? (
                <div className="mt-3 space-y-2 rounded-xl bg-flow-50/60 p-3">
                  <div className="max-w-[8rem]">
                    <Field label="Score (0-100)">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={editScore}
                        onChange={(e) => setEditScore(e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field label="Note">
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                    />
                  </Field>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={() => setEditId(null)}>
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      variant="accent"
                      disabled={updateInspection.isPending}
                      onClick={async () => {
                        await updateInspection.mutateAsync({
                          id: inspection.id,
                          data: { score: Number(editScore), notes: editNotes || null },
                        });
                        setEditId(null);
                      }}
                    >
                      {updateInspection.isPending ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                </div>
              ) : (
                inspection.notes && (
                  <p className="mt-2 whitespace-pre-line text-sm text-canvas-900">{inspection.notes}</p>
                )
              )}
              {inspection.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {inspection.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-full bg-canvas-100 px-2 py-1 text-xs text-canvas-700 hover:bg-canvas-200"
                    >
                      <IconFile className="h-3 w-3" />
                      {photo.photoType === "before" ? "Avant" : "Après"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
