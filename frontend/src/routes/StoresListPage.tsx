import { Link } from "react-router-dom";
import { useStores } from "../hooks/useStores";
import { Button } from "../components/common/Button";
import { AppLayout } from "../components/common/AppLayout";

export function StoresListPage() {
  const { data: stores, isLoading, error } = useStores();

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Magasins</h1>
        <Link to="/stores/new">
          <Button>Nouveau magasin</Button>
        </Link>
      </div>

      {isLoading && <p className="mt-4 text-sm text-gray-500">Chargement...</p>}
      {error && <p className="mt-4 text-sm text-red-600">Erreur de chargement des magasins.</p>}

      {stores && stores.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">Aucun magasin enregistré pour l'instant.</p>
      )}

      {stores && stores.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-500">
              <th className="py-2 pr-3 font-medium">Nom</th>
              <th className="py-2 pr-3 font-medium">Bannière</th>
              <th className="py-2 pr-3 font-medium">Ville</th>
              <th className="py-2 pr-3 font-medium">Fréquence</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-3">
                  <Link to={`/stores/${store.id}`} className="text-blue-600 hover:underline">
                    {store.name}
                  </Link>
                </td>
                <td className="py-2 pr-3">{store.banner ?? "—"}</td>
                <td className="py-2 pr-3">{store.city ?? "—"}</td>
                <td className="py-2 pr-3">{store.cleaningFrequency ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppLayout>
  );
}
