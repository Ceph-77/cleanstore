import { useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { useAnalyticsOverview, useRecentEvents } from "../../hooks/useAnalytics";
import { downloadCsv, type FunnelRow } from "../../api/analytics";

const RANGES = [7, 30, 90] as const;

/** Human labels for the event names emitted by the app. */
const LABELS: Record<string, string> = {
  page_view: "Page vue",
  task_marketplace_viewed: "Marketplace tâches ouvert",
  task_claim_opened: "Formulaire de candidature ouvert",
  task_claim_submitted: "Candidature envoyée",
  task_claim_approved: "Candidature approuvée",
  task_claim_rejected: "Candidature refusée",
  task_started: "Tâche démarrée",
  task_completed: "Tâche complétée",
  task_direct_assigned: "Attribution directe",
  earning_paid: "Gain versé",
  store_marketplace_viewed: "Marketplace magasins ouvert",
  store_claim_submitted: "Demande de magasin envoyée",
  store_claim_approved: "Demande de magasin approuvée",
  store_claim_rejected: "Demande de magasin refusée",
  store_created: "Magasin créé",
  task_published: "Tâche publiée",
  register_viewed: "Page inscription vue",
  register_submitted: "Inscription soumise",
  login_viewed: "Page connexion vue",
  login_submitted: "Connexion soumise",
  login_failed: "Connexion échouée",
};
const label = (name: string) => LABELS[name] ?? name;

function Funnel({ title, subtitle, rows }: { title: string; subtitle: string; rows: FunnelRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="rounded-2xl border border-canvas-200 bg-white p-5 shadow-sm shadow-canvas-900/5">
      <h3 className="font-heading font-semibold text-canvas-900">{title}</h3>
      <p className="mt-0.5 text-xs text-canvas-600">{subtitle}</p>
      <div className="mt-4 space-y-2.5">
        {rows.map((r, i) => (
          <div key={r.name}>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium text-canvas-800">
                {i + 1}. {label(r.name)}
              </span>
              <span className="tabular-nums text-canvas-600">
                {r.count}
                {i > 0 && (
                  <>
                    {" · "}
                    <span className="text-canvas-700">{r.conversionFromFirstPct}%</span>
                    {r.dropFromPrevPct > 0 && (
                      <span className="text-red-600"> · −{r.dropFromPrevPct}%</span>
                    )}
                  </>
                )}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-canvas-100">
              <div
                className="h-full rounded-full bg-flow-500"
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const { data: overview, isLoading } = useAnalyticsOverview(days);
  const { data: recent } = useRecentEvents(days);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadCsv(days);
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">
            Parcours utilisateurs
          </h1>
          <p className="mt-1 text-sm text-canvas-600">
            Où les gens décrochent dans les flux clés. Usage interne — jamais montré aux travailleurs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  days === r ? "bg-flow-600 text-white" : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
                }`}
              >
                {r} j
              </button>
            ))}
          </div>
          <Button variant="secondary" disabled={exporting} onClick={handleExport}>
            {exporting ? "..." : "Exporter CSV"}
          </Button>
        </div>
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {overview && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Funnel
              title="Intention (travailleur)"
              subtitle="Avant l'envoi — par session de navigation"
              rows={overview.intentFunnel}
            />
            <Funnel
              title="Réalisation (travailleur)"
              subtitle="Jalons serveur — par utilisateur"
              rows={overview.deliveryFunnel}
            />
          </div>

          <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-canvas-600">
            Tous les événements ({days} j)
          </h2>
          <div className="overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
            <div className="overflow-x-auto p-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
                    <th className="py-2 pr-3">Événement</th>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2 text-right">Nombre</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.counts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-canvas-600">
                        Aucun événement enregistré sur cette période.
                      </td>
                    </tr>
                  )}
                  {overview.counts.map((c) => (
                    <tr key={`${c.name}-${c.source}`} className="border-b border-canvas-100 last:border-0">
                      <td className="py-2.5 pr-3 text-canvas-900">{label(c.name)}</td>
                      <td className="py-2.5 pr-3 text-canvas-600">{c.source}</td>
                      <td className="py-2.5 text-right font-medium tabular-nums text-canvas-900">{c.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {recent && recent.length > 0 && (
            <>
              <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-canvas-600">
                Derniers événements
              </h2>
              <div className="overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
                <div className="max-h-[28rem] overflow-auto p-5">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
                        <th className="py-2 pr-3">Quand</th>
                        <th className="py-2 pr-3">Événement</th>
                        <th className="py-2 pr-3">Rôle</th>
                        <th className="py-2 pr-3">Chemin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((e) => (
                        <tr key={e.id} className="border-b border-canvas-100 last:border-0">
                          <td className="py-2 pr-3 whitespace-nowrap text-canvas-600">
                            {new Date(e.createdAt).toLocaleString("fr-CA", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td className="py-2 pr-3 text-canvas-900">{label(e.name)}</td>
                          <td className="py-2 pr-3 text-canvas-600">{e.role ?? "—"}</td>
                          <td className="py-2 pr-3 text-canvas-600">{e.path ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </AppLayout>
  );
}
