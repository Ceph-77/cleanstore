import { useState } from "react";
import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { LoadMore } from "../../components/common/LoadMore";
import { useLedger, useLedgerSummary } from "../../hooks/useLedger";
import { downloadLedgerCsv } from "../../api/ledger";

const TYPE_FILTERS: { key: string | "all"; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "gain_cree", label: "Gain créé" },
  { key: "gain_dispo", label: "Gain disponible" },
  { key: "commission", label: "Commission" },
  { key: "retrait", label: "Retrait" },
  { key: "retrait_echoue", label: "Retrait échoué" },
  { key: "charge_sous_traitant", label: "Charge sous-traitant" },
];

const TYPE_STYLES: Record<string, string> = {
  gain_cree: "bg-flow-100 text-flow-700",
  gain_dispo: "bg-flow-100 text-flow-700",
  commission: "bg-linen-100 text-linen-700",
  retrait: "bg-canvas-100 text-canvas-700",
  retrait_echoue: "bg-red-50 text-red-700",
  charge_sous_traitant: "bg-linen-100 text-linen-700",
};

function money(n: number): string {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}

export function LedgerPage() {
  const [type, setType] = useState<string | "all">("all");
  const [exporting, setExporting] = useState(false);
  const filters = { type: type === "all" ? null : type };
  const { data: summary } = useLedgerSummary();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useLedger(filters);
  const rows = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <AppLayout>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">
        Grand livre
      </h1>
      <p className="mt-1 text-sm text-canvas-600">
        Toutes les écritures d'argent, append-only — rien ne s'efface. Vue simplifiée en attendant
        le reste du tableau de bord financier (pénalités, primes, abonnements, panneau Stripe).
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-canvas-200 bg-white p-5 shadow-sm shadow-canvas-900/5">
          <p className="text-xs font-medium uppercase tracking-wide text-canvas-600">
            Passif — dû aux travailleurs
          </p>
          <p className="font-heading text-2xl font-semibold text-canvas-900">
            {summary ? money(summary.passif) : "…"}
          </p>
        </div>
        <div className="rounded-2xl border border-canvas-200 bg-white p-5 shadow-sm shadow-canvas-900/5">
          <p className="text-xs font-medium uppercase tracking-wide text-canvas-600">
            Actif — commissions encaissées
          </p>
          <p className="font-heading text-2xl font-semibold text-canvas-900">
            {summary ? money(summary.actif) : "…"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setType(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              type === f.key
                ? "bg-flow-600 text-white"
                : "bg-canvas-100 text-canvas-700 hover:bg-canvas-200"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="flex-1" />
        <Button
          variant="secondary"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await downloadLedgerCsv(filters);
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? "..." : "Exporter CSV"}
        </Button>
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {!isLoading && rows.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucune écriture pour ce filtre.
        </p>
      )}

      {rows.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
          <div className="overflow-x-auto p-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Montant</th>
                  <th className="py-2 pr-3">Partie</th>
                  <th className="py-2 pr-3">Tâche</th>
                  <th className="py-2">Motif</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-canvas-100 last:border-0">
                    <td className="whitespace-nowrap py-3 pr-3 text-canvas-600">
                      {new Date(r.createdAt).toLocaleString("fr-CA", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          TYPE_STYLES[r.type] ?? "bg-canvas-100 text-canvas-700"
                        }`}
                      >
                        {TYPE_FILTERS.find((f) => f.key === r.type)?.label ?? r.type}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-medium text-canvas-900">
                      {Number(r.amount).toFixed(2)} {r.currency}
                    </td>
                    <td className="py-3 pr-3 text-canvas-700">{r.partyAName ?? "—"}</td>
                    <td className="py-3 pr-3 text-canvas-700">{r.task?.description ?? "—"}</td>
                    <td className="py-3 text-canvas-700">{r.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LoadMore hasNextPage={!!hasNextPage} isFetching={isFetchingNextPage} onClick={() => fetchNextPage()} />
    </AppLayout>
  );
}
