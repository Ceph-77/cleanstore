import { apiClient } from "./client";
import type { GeoPoint, Store, StoreMapPoint } from "../types";

export interface StoreGeofencePayload {
  geofenceLat: number | null;
  geofenceLng: number | null;
  geofenceRadiusM: number | null;
  geofencePoints?: GeoPoint[] | null;
}

export function listStores() {
  return apiClient.get<{ stores: Store[] }>("/stores");
}

export function listStoreMapPoints() {
  return apiClient.get<{ stores: StoreMapPoint[] }>("/stores/map-points");
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

export function setStoreGeofence(id: string, payload: StoreGeofencePayload) {
  return apiClient.patch<{ store: Store }>(`/stores/${id}/geofence`, payload);
}
