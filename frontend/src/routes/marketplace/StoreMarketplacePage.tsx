import { AppLayout } from "../../components/common/AppLayout";
import { Button } from "../../components/common/Button";
import { IconStore, IconMapPin } from "../../components/common/icons";
import { useAvailableStores, useMyStoreClaims, useClaimStore } from "../../hooks/useMarketplace";

export function StoreMarketplacePage() {
  const { data: stores, isLoading } = useAvailableStores();
  const { data: myClaims } = useMyStoreClaims();
  const claimStore = useClaimStore();

  function claimStatusFor(storeId: string) {
    return myClaims?.find((c) => c.storeId === storeId)?.status;
  }

  return (
    <AppLayout>
      <p className="text-xs font-semibold uppercase tracking-wider text-flow-600">Marketplace</p>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-canvas-900">Magasins disponibles</h1>
      <p className="mt-1 text-sm text-canvas-600">
        Manifeste ton intérêt pour un magasin — l'admin confirme l'assignation.
      </p>

      {isLoading && <p className="mt-8 text-sm text-canvas-600">Chargement...</p>}

      {stores && stores.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center">
          <p className="text-sm text-canvas-600">Aucun magasin disponible pour l'instant.</p>
        </div>
      )}

      {stores && stores.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const status = claimStatusFor(store.id);
            return (
              <div
                key={store.id}
                className="rounded-2xl border border-canvas-200 bg-white p-5 shadow-sm shadow-canvas-900/5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flow-100 text-flow-700">
                    <IconStore className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="font-heading font-semibold text-canvas-900">{store.name}</h3>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-canvas-600">
                  <IconMapPin className="h-3.5 w-3.5 shrink-0" />
                  {store.city ?? "Ville non spécifiée"}
                </p>
                {store.grandeCompagnie && (
                  <p className="mt-1 text-xs text-canvas-600">Client : {store.grandeCompagnie.name}</p>
                )}
                <div className="mt-4">
                  {status === "pending" && (
                    <span className="inline-block rounded-full bg-linen-100 px-3 py-1 text-xs font-medium text-linen-800">
                      Demande en attente
                    </span>
                  )}
                  {status === "rejected" && (
                    <span className="inline-block rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                      Demande refusée
                    </span>
                  )}
                  {!status && (
                    <Button
                      variant="accent"
                      className="w-full"
                      disabled={claimStore.isPending}
                      onClick={() => claimStore.mutate(store.id)}
                    >
                      Je suis intéressé
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
