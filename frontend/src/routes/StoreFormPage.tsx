import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/common/AppLayout";
import { StoreForm, type StoreFormValues } from "../components/stores/StoreForm";
import { toStorePayload } from "../components/stores/storeFormPayload";
import { useCreateStore } from "../hooks/useStores";

export function StoreFormPage() {
  const navigate = useNavigate();
  const createStore = useCreateStore();

  async function handleSubmit(values: StoreFormValues) {
    const { store } = await createStore.mutateAsync(toStorePayload(values));
    navigate(`/stores/${store.id}`);
  }

  return (
    <AppLayout>
      <Link to="/stores" className="text-sm text-flow-700 hover:text-flow-900">
        ← Tous les magasins
      </Link>
      <h1 className="font-heading mb-6 mt-3 text-2xl font-semibold tracking-tight text-canvas-900">Nouveau magasin</h1>
      <StoreForm onSubmit={handleSubmit} submitting={createStore.isPending} />
    </AppLayout>
  );
}
