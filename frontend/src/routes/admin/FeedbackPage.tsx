import { useMemo, useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { IconTrash } from "../../components/common/icons";
import { useFeedbackList, useDeleteFeedback } from "../../hooks/useFeedback";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

export function FeedbackPage() {
  const { data: entries, isLoading } = useFeedbackList();
  const deleteFeedback = useDeleteFeedback();
  const [sectionFilter, setSectionFilter] = useState("");

  const sections = useMemo(
    () => [...new Set((entries ?? []).map((e) => e.section))].sort(),
    [entries]
  );

  const filtered = useMemo(
    () => (entries ?? []).filter((e) => !sectionFilter || e.section === sectionFilter),
    [entries, sectionFilter]
  );

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">Feedback</h1>
          <p className="mt-1 text-sm text-canvas-600">
            Notes envoyées depuis le bouton ✎ Feedback par les utilisateurs connectés.
          </p>
        </div>
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
          <div
            key={entry.id}
            className="rounded-2xl border border-canvas-200 bg-white p-4 shadow-sm shadow-canvas-900/5"
          >
            <div className="flex flex-wrap items-center gap-2">
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
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-canvas-800">{entry.note}</p>
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
        ))}
      </div>
    </AppLayout>
  );
}
