import { apiClient } from "./client";
import type { StoreContact } from "../types";

export function listContacts(storeId: string) {
  return apiClient.get<{ contacts: StoreContact[] }>(`/stores/${storeId}/contacts`);
}

export function createContact(storeId: string, data: Partial<StoreContact>) {
  return apiClient.post<{ contact: StoreContact }>(`/stores/${storeId}/contacts`, data);
}

export function updateContact(id: string, data: Partial<StoreContact>) {
  return apiClient.patch<{ contact: StoreContact }>(`/store-contacts/${id}`, data);
}

export function deleteContact(id: string) {
  return apiClient.delete<void>(`/store-contacts/${id}`);
}
