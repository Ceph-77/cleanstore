import { useStripeOverview } from "../../hooks/usePayments";

function money(n: number, currency: string): string {
  return n.toLocaleString("fr-CA", { style: "currency", currency: currency.toUpperCase() });
}

function when(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString("fr-CA", { dateStyle: "medium", timeStyle: "short" });
}

const DISPUTE_STYLES: Record<string, string> = {
  needs_response: "bg-red-50 text-red-700",
  warning_needs_response: "bg-red-50 text-red-700",
  under_review: "bg-linen-100 text-linen-800",
  won: "bg-green-50 text-green-700",
  lost: "bg-canvas-100 text-canvas-700",
};

/**
 * Panneau Stripe en LECTURE SEULE (Q63) — aide la réconciliation, ne
 * déclenche jamais rien. Affiché seulement si Stripe est configuré.
 */
export function StripeOverviewPanel() {
  const { data, isLoading } = useStripeOverview();

  if (isLoading) return null;
  if (!data || !data.configured) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-canvas-300 bg-white p-4 text-sm text-canvas-600">
        Panneau Stripe non disponible — Stripe n'est pas configuré sur ce serveur.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-canvas-200 bg-white p-5 shadow-sm shadow-canvas-900/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-canvas-600">
        Panneau Stripe (lecture seule)
      </p>

      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-canvas-600">Solde plateforme — disponible</p>
          {data.balance.available.length === 0 && <p className="text-sm text-canvas-500">—</p>}
          {data.balance.available.map((b) => (
            <p key={b.currency} className="font-heading text-lg font-semibold text-canvas-900">
              {money(b.amount, b.currency)}
            </p>
          ))}
        </div>
        <div>
          <p className="text-xs font-medium text-canvas-600">Solde plateforme — en attente</p>
          {data.balance.pending.length === 0 && <p className="text-sm text-canvas-500">—</p>}
          {data.balance.pending.map((b) => (
            <p key={b.currency} className="font-heading text-lg font-semibold text-canvas-900">
              {money(b.amount, b.currency)}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-canvas-600">
            Virements récents
          </p>
          <div className="space-y-1.5 text-xs">
            {data.transfers.length === 0 && <p className="text-canvas-500">Aucun virement récent.</p>}
            {data.transfers.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas-50 px-2 py-1.5">
                <span className="truncate text-canvas-700">{when(t.created)}</span>
                <span className="shrink-0 font-medium text-canvas-900">
                  {money(t.amount, t.currency)}
                  {t.reversed && <span className="ml-1 text-red-700">(inversé)</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-canvas-600">
            Charges récentes (sous-traitants)
          </p>
          <div className="space-y-1.5 text-xs">
            {data.charges.length === 0 && <p className="text-canvas-500">Aucune charge récente.</p>}
            {data.charges.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas-50 px-2 py-1.5">
                <span className="truncate text-canvas-700">{when(c.created)}</span>
                <span className="shrink-0 font-medium text-canvas-900">
                  {money(c.amount, c.currency)}{" "}
                  <span className="text-canvas-500">({c.status})</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-canvas-600">Litiges</p>
          <div className="space-y-1.5 text-xs">
            {data.disputes.length === 0 && <p className="text-canvas-500">Aucun litige.</p>}
            {data.disputes.map((d) => (
              <div key={d.id} className="rounded-lg bg-canvas-50 px-2 py-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-canvas-700">{when(d.created)}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${DISPUTE_STYLES[d.status] ?? "bg-canvas-100 text-canvas-700"}`}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="mt-0.5 font-medium text-canvas-900">
                  {money(d.amount, d.currency)} — {d.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
