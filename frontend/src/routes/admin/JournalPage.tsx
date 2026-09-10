import { useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { LoadMore } from "../../components/common/LoadMore";
import { useAudit } from "../../hooks/useAudit";
import type { AuditEntry } from "../../types";

const SECTION_FILTERS: { key: string | "all"; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "users", label: "Utilisateurs" },
  { key: "roles", label: "Rôles" },
  { key: "stores", label: "Magasins" },
  { key: "task_templates", label: "Modèles" },
  { key: "markettask", label: "Demandes" },
  { key: "finance", label: "Finances" },
  { key: "feedback", label: "Feedback" },
  { key: "settings", label: "Réglages" },
];

const ACTION_STYLES: Record<string, string> = {
  create: "bg-flow-100 text-flow-700",
  update: "bg-canvas-100 text-canvas-700",
  delete: "bg-red-50 text-red-700",
  decision: "bg-linen-100 text-linen-700",
};

const ACTION_LABELS: Record<string, string> = {
  create: "création",
  update: "modification",
  delete: "suppression",
  decision: "décision",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-CA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ entry }: { entry: AuditEntry }) {
  const style = ACTION_STYLES[entry.action] ?? "bg-canvas-100 text-canvas-700";
  return (
    <tr className="border-t border-canvas-100">
      <td className="whitespace-nowrap py-3 pr-3 text-canvas-600">{formatDate(entry.createdAt)}</td>
      <td className="py-3 pr-3 text-canvas-800">{entry.actorLabel ?? "—"}</td>
      <td className="py-3 pr-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${style}`}>
          {ACTION_LABELS[entry.action] ?? entry.action}
        </span>
      </td>
      <td className="py-3 pr-3 text-canvas-800">{entry.entityType}</td>
      <td className="py-3 text-canvas-700">{entry.summary ?? "—"}</td>
    </tr>
  );
}

export function JournalPage() {
  const [section, setSection] = useState<string | "all">("all");
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useAudit({
    section: section === "all" ? null : section,
  });
  const entries = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">
        Journal d'audit
      </h1>
      <p className="mt-1 text-sm text-canvas-600">
        Qui a fait quoi, quand. Chaque action de gestion est enregistrée et ne peut pas être modifiée.
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        {SECTION_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setSection(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              section === f.key
                ? "bg-flow-600 text-white"
                : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {!isLoading && entries.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucune action de gestion enregistrée pour ce filtre. Le journal se remplit à mesure que les
          actions de la console y sont branchées.
        </p>
      )}

      {entries.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Acteur</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Entité</th>
                  <th className="py-2">Détail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <Row key={e.id} entry={e} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LoadMore
        hasNextPage={!!hasNextPage}
        isFetching={isFetchingNextPage}
        onClick={() => fetchNextPage()}
      />
    </AppLayout>
  );
}
