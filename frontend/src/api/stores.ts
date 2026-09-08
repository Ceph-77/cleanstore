import { apiClient } from "./client";
import { pageQuery, type Page } from "./pagination";
import type { GeoPoint, Store, StoreMapPoint } from "../types";

export interface StoreGeofencePayload {
  geofenceLat: number | null;
  geofenceLng: number | null;
  geofenceRadiusM: number | null;
  geofencePoints?: GeoPoint[] | null;
}

export async function listStores(cursor?: string | null): Promise<Page<Store>> {
  const r = await apiClient.get<{ stores: Store[]; nextCursor: string | null }>(
    `/stores${pageQuery(cursor)}`
  );
  return { items: r.stores, nextCursor: r.nextCursor };
}

export function listStoreMapPoints() {
  return apiClient.get<{ stores: StoreMapPoint[] }>("/stores/map-points");
}

export interface StoreOption {
  id: string;
  name: string;
  city: string | null;
}

/** Every active store, id/name/city only — for pickers. Not paginated. */
export function listStoreOptions() {
  return apiClient.get<{ stores: StoreOption[] }>("/stores/options");
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
