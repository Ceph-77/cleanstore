import { apiClient } from "./client";
import type { ChecklistItem, StoreInspection } from "../types";

export function listStoreInspections(storeId: string) {
  return apiClient.get<{ inspections: StoreInspection[] }>(`/stores/${storeId}/inspections`);
}

export function updateStoreInspection(
  storeId: string,
  id: string,
  data: { score?: number; notes?: string | null; checklist?: ChecklistItem[] }
) {
  return apiClient.patch<{ inspection: StoreInspection }>(`/stores/${storeId}/inspections/${id}`, data);
}

export function createStoreInspection(
  storeId: string,
  data: { score: number; notes: string; checklist: ChecklistItem[] },
  photosBefore: File[],
  photosAfter: File[]
) {
  const formData = new FormData();
  formData.append("score", String(data.score));
  formData.append("notes", data.notes);
  formData.append("checklist", JSON.stringify(data.checklist));
  photosBefore.forEach((file) => formData.append("photosBefore", file));
  photosAfter.forEach((file) => formData.append("photosAfter", file));
  return apiClient.upload<{ inspection: StoreInspection }>(`/stores/${storeId}/inspections`, formData);
}
