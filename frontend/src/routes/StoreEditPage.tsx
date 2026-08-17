import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/common/AppLayout";
import { StoreForm, type StoreFormValues } from "../components/stores/StoreForm";
import { toStorePayload } from "../components/stores/storeFormPayload";
import { useStore, useUpdateStore } from "../hooks/useStores";

export function StoreEditPage() {
  const { id } = useParams<{ id: string }>();
  const storeId = id!;
  const { data: store, isLoading } = useStore(storeId);
  const updateStore = useUpdateStore(storeId);
  const navigate = useNavigate();

  async function handleSubmit(values: StoreFormValues) {
    await updateStore.mutateAsync(toStorePayload(values));
    navigate(`/stores/${storeId}`);
  }

  if (isLoading || !store) {
    return (
      <AppLayout>
        <p className="text-sm text-canvas-600">Chargement...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Link to={`/stores/${storeId}`} className="text-sm text-flow-700 hover:text-flow-900">
        ← {store.name}
      </Link>
      <h1 className="font-heading mb-6 mt-3 text-2xl font-semibold tracking-tight text-canvas-900">
        Modifier le magasin
      </h1>
      <StoreForm initial={store} onSubmit={handleSubmit} submitting={updateStore.isPending} />
    </AppLayout>
  );
}
