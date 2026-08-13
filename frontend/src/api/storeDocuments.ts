import { apiClient } from "./client";
import type { StoreDocument } from "../types";

export function listDocuments(storeId: string) {
  return apiClient.get<{ documents: StoreDocument[] }>(`/stores/${storeId}/documents`);
}

export function uploadDocument(storeId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.upload<{ document: StoreDocument }>(`/stores/${storeId}/documents`, formData);
}

export function deleteDocument(id: string) {
  return apiClient.delete<void>(`/store-documents/${id}`);
}
