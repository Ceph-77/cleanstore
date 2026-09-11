import { Link } from "react-router-dom";
import { AppLayout } from "../../components/common/AppLayout";
import { useInventoryAlertItems } from "../../hooks/useInventory";
import { IconInventory } from "../../components/common/icons";
import type { InventoryAlertItem } from "../../types";

function AlertRow({ item, badge }: { item: InventoryAlertItem; badge: string }) {
  return (
    <tr className="border-b border-canvas-100 last:border-0">
      <td className="py-3 pr-3 text-canvas-900">{item.name}</td>
      <td className="py-3 pr-3 text-canvas-700">
        <Link to={`/stores/${item.store.id}`} className="text-flow-700 hover:text-flow-900">
          {item.store.name}
        </Link>
      </td>
      <td className="py-3 pr-3 text-canvas-700">
        {Number(item.quantity)} {item.unit ?? ""}
        {item.lowThreshold != null && ` (seuil ${Number(item.lowThreshold)})`}
        {item.expiryDate && ` — expire ${item.expiryDate.slice(0, 10)}`}
      </td>
      <td className="py-3 text-right">
        <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
          {badge}
        </span>
      </td>
    </tr>
  );
}

export function InventoryAlertsPage() {
  const { data, isLoading } = useInventoryAlertItems();

  return (
    <AppLayout>
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-flow-100 text-flow-700">
          <IconInventory className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-canvas-900">
            Équipements &amp; stock
          </h1>
          <p className="text-sm text-canvas-600">
            Alertes tous magasins confondus — stock sous le seuil ou produit chimique proche de la
            péremption. Le détail complet par magasin se gère dans l'onglet « Équipements & stock »
            de chaque fiche.
          </p>
        </div>
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {!isLoading && data && data.lowStock.length === 0 && data.expiringSoon.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucune alerte pour le moment.
        </p>
      )}

      {data && data.lowStock.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
          <div className="overflow-x-auto p-5">
            <h2 className="mb-3 font-heading text-sm font-semibold text-canvas-900">Stock bas</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
                  <th className="py-2 pr-3">Article</th>
                  <th className="py-2 pr-3">Magasin</th>
                  <th className="py-2 pr-3">Quantité</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.lowStock.map((item) => (
                  <AlertRow key={item.id} item={item} badge="Bas" />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.expiringSoon.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-canvas-200 bg-white shadow-sm shadow-canvas-900/5">
          <div className="overflow-x-auto p-5">
            <h2 className="mb-3 font-heading text-sm font-semibold text-canvas-900">
              Péremption proche (≤14 jours)
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-canvas-200 text-left text-xs font-semibold uppercase tracking-wide text-canvas-600">
                  <th className="py-2 pr-3">Article</th>
                  <th className="py-2 pr-3">Magasin</th>
                  <th className="py-2 pr-3">Quantité</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {data.expiringSoon.map((item) => (
                  <AlertRow key={item.id} item={item} badge="Bientôt" />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
