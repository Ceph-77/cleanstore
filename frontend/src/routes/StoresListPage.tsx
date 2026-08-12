import { Link } from "react-router-dom";
import { useStores } from "../hooks/useStores";
import { Button } from "../components/common/Button";
import { AppLayout } from "../components/common/AppLayout";
import { StatCard } from "../components/common/StatCard";
import { IconStore, IconMapPin, IconBuilding } from "../components/common/icons";

export function StoresListPage() {
  const { data: stores, isLoading, error } = useStores();

  const villesDesservies = stores ? new Set(stores.map((s) => s.city).filter(Boolean)).size : 0;
  const sousTraitesAssignes = stores ? stores.filter((s) => s.assignedSubcontractorId).length : 0;

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Opérations</p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Magasins</h1>
        </div>
        <Link to="/stores/new">
          <Button variant="accent">+ Nouveau magasin</Button>
        </Link>
      </div>

      {stores && stores.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Magasins enregistrés" value={stores.length} icon={<IconStore />} accent="flow" />
          <StatCard
            label="Villes desservies"
            value={villesDesservies}
            icon={<IconMapPin />}
            accent="linen"
            to="/stores/map"
          />
          <StatCard
            label="Avec sous-traitant assigné"
            value={sousTraitesAssignes}
            icon={<IconBuilding />}
            accent="flow"
          />
        </div>
      )}

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}
      {error && (
        <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Erreur de chargement des magasins.
        </p>
      )}

      {stores && stores.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-flow-100 text-flow-700">
            <IconStore className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm text-canvas-600">Aucun magasin enregistré pour l'instant.</p>
          <Link to="/stores/new" className="mt-4 inline-block">
            <Button variant="accent">Enregistrer le premier magasin</Button>
          </Link>
        </div>
      )}

      {stores && stores.length > 0 && (
        <>
          <h2 className="mt-10 mb-4 text-sm font-semibold uppercase tracking-wide text-canvas-600">
            Tous les magasins
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Link
                key={store.id}
                to={`/stores/${store.id}`}
                className="group rounded-2xl border border-canvas-200 bg-white p-5 shadow-sm shadow-canvas-900/5 transition hover:-translate-y-0.5 hover:border-flow-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flow-100 text-flow-700">
                      <IconStore className="h-[18px] w-[18px]" />
                    </span>
                    <h3 className="font-heading font-semibold text-canvas-900 group-hover:text-flow-700">
                      {store.name}
                    </h3>
                  </div>
                  {store.banner && (
                    <span className="shrink-0 rounded-full bg-linen-100 px-2 py-0.5 text-xs font-medium text-linen-800">
                      {store.banner}
                    </span>
                  )}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-canvas-600">
                  <IconMapPin className="h-3.5 w-3.5 shrink-0" />
                  {store.city ?? "Ville non spécifiée"}
                </p>
                <div className="mt-3 flex items-center gap-2 border-t border-canvas-100 pt-3 text-xs text-canvas-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-flow-400" />
                  {store.cleaningFrequency ?? "Fréquence non définie"}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
