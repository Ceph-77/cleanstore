import { useMemo, useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { IconTrash } from "../../components/common/icons";
import {
  useFeedbackList,
  useDeleteFeedback,
  useUpdateFeedback,
  useConvertFeedbackToIncident,
} from "../../hooks/useFeedback";
import type { Feedback, FeedbackStatus } from "../../types";

const STATUS_LABELS: Record<FeedbackStatus, string> = {
  non_lu: "Non lu",
  lu: "Lu",
  en_traitement: "En traitement",
  resolu: "Résolu",
  ignore: "Ignoré",
};

const STATUS_STYLES: Record<FeedbackStatus, string> = {
  non_lu: "bg-flow-100 text-flow-700",
  lu: "bg-canvas-100 text-canvas-700",
  en_traitement: "bg-linen-100 text-linen-800",
  resolu: "bg-green-50 text-green-700",
  ignore: "bg-canvas-100 text-canvas-500",
};

const CATEGORIES = ["finance", "technique", "operations"];

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

function TriageRow({ entry }: { entry: Feedback }) {
  const update = useUpdateFeedback();
  const convert = useConvertFeedbackToIncident();
  const deleteFeedback = useDeleteFeedback();

  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => update.mutate({ id: entry.id, data: { isImportant: !entry.isImportant } })}
          title="Marquer important"
          className={entry.isImportant ? "text-linen-600" : "text-canvas-300 hover:text-canvas-500"}
        >
          ★
        </button>
        <span className="rounded-full bg-linen-100 px-2 py-0.5 text-xs font-medium text-linen-800">
          {entry.section}
        </span>
        {entry.isMulti && (
          <span className="rounded-full bg-canvas-100 px-2 py-0.5 text-xs font-medium text-canvas-700">
            ⊞ multi
          </span>
        )}
        <code className="rounded-md bg-canvas-50 px-1.5 py-0.5 text-xs text-canvas-600">{entry.context}</code>
        <code className="max-w-full truncate rounded-md bg-canvas-50 px-1.5 py-0.5 text-xs text-canvas-600">
          {entry.selector}
        </code>
        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[entry.status]}`}>
          {STATUS_LABELS[entry.status]}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-canvas-800">{entry.note}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select
          value={entry.status}
          onChange={(e) => update.mutate({ id: entry.id, data: { status: e.target.value as FeedbackStatus } })}
          className="rounded-lg border border-canvas-300 bg-white px-2 py-1 text-xs"
        >
          {Object.entries(STATUS_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={entry.assignedCategory ?? ""}
          onChange={(e) =>
            update.mutate({ id: entry.id, data: { assignedCategory: e.target.value || null } })
          }
          className="rounded-lg border border-canvas-300 bg-white px-2 py-1 text-xs"
        >
          <option value="">Aiguiller vers...</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {entry.convertedIncidentId ? (
          <span className="text-xs text-canvas-600">→ incident lié</span>
        ) : (
          <button
            className="text-xs font-medium text-flow-700 hover:underline"
            disabled={convert.isPending}
            onClick={() => convert.mutate({ id: entry.id, type: "autre", severity: "mineur" })}
          >
            Convertir en incident
          </button>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-canvas-500">
          {entry.user?.fullName ?? entry.user?.email ?? "Utilisateur supprimé"}
          {entry.role && ` · ${entry.role}`}
          {" · "}
          {formatDateTime(entry.createdAt)}
        </p>
        <Button
          variant="danger"
          className="!px-2 !py-1"
          disabled={deleteFeedback.isPending}
          onClick={() => deleteFeedback.mutate(entry.id)}
        >
          <IconTrash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function FeedbackPage() {
  const { data: entries, isLoading } = useFeedbackList();
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");

  const sections = useMemo(
    () => [...new Set((entries ?? []).map((e) => e.section))].sort(),
    [entries]
  );

  const filtered = useMemo(
    () =>
      (entries ?? []).filter(
        (e) => (!sectionFilter || e.section === sectionFilter) && (statusFilter === "all" || e.status === statusFilter)
      ),
    [entries, sectionFilter, statusFilter]
  );

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Feedback</h1>
          <p className="mt-1 text-sm text-canvas-600">
            Notes envoyées depuis le bouton ✎ Feedback par les utilisateurs connectés.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | "all")}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          {sections.length > 0 && (
            <select
              className="rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="">Toutes les sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {isLoading && (
          <p className="rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-8 text-center text-sm text-canvas-600">
            Chargement...
          </p>
        )}
        {!isLoading && filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-8 text-center text-sm text-canvas-600">
            Aucune note de feedback pour l'instant.
          </p>
        )}
        {filtered.map((entry) => (
          <TriageRow key={entry.id} entry={entry} />
        ))}
      </div>
    </AppLayout>
  );
}
