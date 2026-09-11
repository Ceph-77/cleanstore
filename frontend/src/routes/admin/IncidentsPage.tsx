import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { LoadMore } from "../../components/common/LoadMore";
import { useIncidents, useUpdateIncident, useAddIncidentNote } from "../../hooks/useIncidents";
import type { Incident, IncidentSeverity, IncidentStatus } from "../../types";

const TYPE_LABELS: Record<string, string> = {
  blessure: "Blessure",
  degat: "Dégât matériel",
  vol: "Vol",
  incendie: "Incendie",
  sante: "Santé",
  autre: "Autre",
};

const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  mineur: "bg-canvas-100 text-canvas-700",
  majeur: "bg-linen-100 text-linen-800",
  urgence: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  ouverte: "Ouverte",
  en_traitement: "En traitement",
  resolue: "Résolue",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

function IncidentRow({ incident }: { incident: Incident }) {
  const update = useUpdateIncident();
  const addNote = useAddIncidentNote();
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-canvas-900">
            {TYPE_LABELS[incident.type]}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_STYLES[incident.severity]}`}>
              {incident.severity}
            </span>
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-canvas-800">{incident.description}</p>
          <p className="mt-1 text-xs text-canvas-600">
            {incident.reportedBy?.fullName ?? incident.reportedBy?.email ?? "Anonyme"}
            {incident.store && <> · {incident.store.name}</>}
            {incident.task && <> · tâche : {incident.task.description}</>}
            {" · "}
            {formatDateTime(incident.createdAt)}
          </p>
        </div>
        <select
          value={incident.status}
          onChange={(e) => update.mutate({ id: incident.id, data: { status: e.target.value as IncidentStatus } })}
          className="shrink-0 rounded-full border border-canvas-300 bg-white px-2.5 py-1 text-xs font-medium"
        >
          {Object.entries(STATUS_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <button
        className="mt-2 text-xs font-medium text-flow-700 hover:text-flow-900"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? "Masquer les notes" : `Notes (${incident.notes.length})`}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 border-t border-canvas-200 pt-2">
          <ul className="space-y-1 text-xs text-canvas-700">
            {incident.notes.map((n) => (
              <li key={n.id}>
                <span className="font-medium text-canvas-900">
                  {n.author?.fullName ?? n.author?.email ?? "—"} — {formatDateTime(n.createdAt)}
                </span>
                <br />
                {n.body}
              </li>
            ))}
            {incident.notes.length === 0 && <li className="text-canvas-500">Aucune note.</li>}
          </ul>
          <div className="flex gap-2">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ajouter une note de suivi..."
              className="flex-1 rounded-lg border border-canvas-300 bg-white px-3 py-1.5 text-sm"
            />
            <Button
              variant="secondary"
              disabled={addNote.isPending || !note.trim()}
              onClick={() => {
                addNote.mutate({ id: incident.id, body: note.trim() });
                setNote("");
              }}
            >
              Ajouter
            </Button>
          </div>
          {incident.store && (
            <Link to={`/stores/${incident.store.id}`} className="inline-block text-xs text-flow-700 hover:underline">
              Voir le magasin →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export function IncidentsPage() {
  const [status, setStatus] = useState<IncidentStatus | "all">("ouverte");
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useIncidents(status);
  const incidents = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Incidents</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Blessure, dégât, vol, incendie, santé — signalés par n'importe qui, n'importe quand.
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {(["ouverte", "en_traitement", "resolue", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              status === s ? "bg-flow-600 text-white" : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
            }`}
          >
            {s === "all" ? "Tout" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {!isLoading && incidents.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucun incident pour ce filtre.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {incidents.map((i) => (
          <IncidentRow key={i.id} incident={i} />
        ))}
      </div>

      <LoadMore hasNextPage={!!hasNextPage} isFetching={isFetchingNextPage} onClick={() => fetchNextPage()} />
    </AppLayout>
  );
}
