import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCreateIncident } from "../../hooks/useIncidents";
import { Button } from "../common/Button";
import { Field } from "../common/Field";
import type { IncidentSeverity, IncidentType } from "../../types";

const TYPE_LABELS: Record<IncidentType, string> = {
  blessure: "Blessure",
  degat: "Dégât matériel",
  vol: "Vol",
  incendie: "Incendie",
  sante: "Problème de santé",
  autre: "Autre",
};

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  mineur: "Mineur",
  majeur: "Majeur",
  urgence: "Urgence",
};

/**
 * Bouton "Signaler un incident" — toujours accessible, tout user connecté
 * (Q41-43). Volontairement PAS de raccourci "pré-rempli depuis la tâche en
 * cours" ici (nécessiterait de connaître la tâche active hors contexte) —
 * MyTasksPage a son propre déclenchement pré-rempli.
 */
export function IncidentButton({ storeId, taskId }: { storeId?: string; taskId?: string } = {}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<IncidentType>("autre");
  const [severity, setSeverity] = useState<IncidentSeverity>("mineur");
  const [description, setDescription] = useState("");
  const [done, setDone] = useState(false);
  const createIncident = useCreateIncident();

  if (!user) return null;

  async function handleSubmit() {
    if (!description.trim()) return;
    await createIncident.mutateAsync({ type, severity, description: description.trim(), storeId, taskId });
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setDescription("");
      setType("autre");
      setSeverity("mineur");
    }, 1600);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 left-5 z-[2000] rounded-full bg-red-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-red-900/25 hover:bg-red-700"
      >
        ⚠ Signaler un incident
      </button>

      {open && (
        <div className="fixed inset-0 z-[2001] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            {done ? (
              <p className="py-8 text-center text-sm font-medium text-canvas-900">
                ✓ Incident signalé. Pour une urgence, compose le 911 toi-même.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold text-canvas-900">Signaler un incident</h2>
                  <button onClick={() => setOpen(false)} className="text-canvas-500 hover:text-canvas-800">
                    ✕
                  </button>
                </div>
                <p className="mt-1 text-xs text-red-700">
                  Pour une urgence vitale, appelle le 911 toi-même — ce formulaire prévient l'équipe, il ne
                  remplace pas les secours.
                </p>
                <div className="mt-4 space-y-3">
                  <Field label="Type">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as IncidentType)}
                      className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                    >
                      {Object.entries(TYPE_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Gravité">
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                      className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                    >
                      {Object.entries(SEVERITY_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Description">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Ce qui s'est passé, où, qui est impliqué..."
                      className="w-full rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
                    />
                  </Field>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setOpen(false)}>
                    Annuler
                  </Button>
                  <Button
                    variant="danger"
                    disabled={createIncident.isPending || !description.trim()}
                    onClick={handleSubmit}
                  >
                    {createIncident.isPending ? "Envoi..." : "Signaler"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
