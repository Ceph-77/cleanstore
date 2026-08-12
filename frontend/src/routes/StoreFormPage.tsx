import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/common/AppLayout";
import { StoreForm, type StoreFormValues } from "../components/stores/StoreForm";
import { useCreateStore } from "../hooks/useStores";
import type { Store } from "../types";

function toPayload(values: StoreFormValues): Partial<Store> {
  return {
    name: values.name,
    banner: values.banner || undefined,
    address: values.address || undefined,
    city: values.city || undefined,
    postalCode: values.postalCode || undefined,
    storeManagerName: values.storeManagerName || undefined,
    storeManagerPhone: values.storeManagerPhone || undefined,
    storeManagerEmail: values.storeManagerEmail || undefined,
    squareFootage: values.squareFootage || undefined,
    surfaceType: values.surfaceType || undefined,
    zones: values.zones
      ? values.zones.split(",").map((z) => z.trim()).filter(Boolean)
      : undefined,
    cleaningFrequency: values.cleaningFrequency || undefined,
    cleaningSchedule: values.cleaningSchedule || undefined,
    contractStartDate: values.contractStartDate || undefined,
    contractEndDate: values.contractEndDate || undefined,
    contractRate: values.contractRate || undefined,
    grandeCompagnieId: values.grandeCompagnieId || undefined,
    assignedSubcontractorId: values.assignedSubcontractorId || undefined,
  } as unknown as Partial<Store>;
}

export function StoreFormPage() {
  const navigate = useNavigate();
  const createStore = useCreateStore();

  async function handleSubmit(values: StoreFormValues) {
    const { store } = await createStore.mutateAsync(toPayload(values));
    navigate(`/stores/${store.id}`);
  }

  return (
    <AppLayout>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Nouveau magasin</h1>
      <StoreForm onSubmit={handleSubmit} submitting={createStore.isPending} />
    </AppLayout>
  );
}
