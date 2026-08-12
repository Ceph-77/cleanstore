import { Link } from "react-router-dom";
import { useStores } from "../hooks/useStores";
import { Button } from "../components/common/Button";
import { AppLayout } from "../components/common/AppLayout";

export function StoresListPage() {
  const { data: stores, isLoading, error } = useStores();

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-canvas-900">Magasins</h1>
          <p className="mt-1 text-sm text-canvas-600">
            {stores ? `${stores.length} magasin${stores.length === 1 ? "" : "s"} enregistré${stores.length === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <Link to="/stores/new">
          <Button variant="accent">+ Nouveau magasin</Button>
        </Link>
      </div>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}
      {error && (
        <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Erreur de chargement des magasins.
        </p>
      )}

      {stores && stores.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-canvas-50 px-6 py-16 text-center">
          <p className="text-sm text-canvas-600">Aucun magasin enregistré pour l'instant.</p>
          <Link to="/stores/new" className="mt-3 inline-block">
            <Button variant="accent">Enregistrer le premier magasin</Button>
          </Link>
        </div>
      )}

      {stores && stores.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Link
              key={store.id}
              to={`/stores/${store.id}`}
              className="group rounded-2xl border border-canvas-200 bg-white p-5 shadow-sm shadow-canvas-900/5 transition hover:-translate-y-0.5 hover:border-flow-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-canvas-900 group-hover:text-flow-700">{store.name}</h2>
                {store.banner && (
                  <span className="rounded-full bg-linen-100 px-2 py-0.5 text-xs font-medium text-linen-800">
                    {store.banner}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-canvas-600">{store.city ?? "Ville non spécifiée"}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-canvas-600">
                <span className="h-1.5 w-1.5 rounded-full bg-flow-400" />
                {store.cleaningFrequency ?? "Fréquence non définie"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
