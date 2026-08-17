import type { Store } from "../../types";
import type { StoreFormValues } from "./StoreForm";

export function toStorePayload(values: StoreFormValues): Partial<Store> {
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
    securityAccessInfo: values.securityAccessInfo || undefined,
    storeHours: values.storeHours || undefined,
    specialRequirements: values.specialRequirements || undefined,
    grandeCompagnieId: values.grandeCompagnieId || undefined,
    assignedSubcontractorId: values.assignedSubcontractorId || undefined,
  } as unknown as Partial<Store>;
}
