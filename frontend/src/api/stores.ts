import { apiClient } from "./client";
import type { Store } from "../types";

export function listStores() {
  return apiClient.get<{ stores: Store[] }>("/stores");
}

export function getStore(id: string) {
  return apiClient.get<{ store: Store }>(`/stores/${id}`);
}

export function createStore(data: Partial<Store>) {
  return apiClient.post<{ store: Store }>("/stores", data);
}

export function updateStore(id: string, data: Partial<Store>) {
  return apiClient.patch<{ store: Store }>(`/stores/${id}`, data);
}

export function archiveStore(id: string) {
  return apiClient.patch<{ store: Store }>(`/stores/${id}/archive`);
}
