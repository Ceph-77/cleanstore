import { apiClient } from "./client";
import type { InventoryAlertItems, InventoryItem, InventoryKind, InventoryMovementRow } from "../types";

export interface ItemInput {
  kind: InventoryKind;
  name: string;
  unit?: string | null;
  quantity?: number;
  lowThreshold?: number | null;
  expiryDate?: string | null;
  odometer?: number | null;
  lastServiceAt?: string | null;
  nextServiceAt?: string | null;
  condition?: string | null;
}

export const listInventory = (storeId: string) =>
  apiClient.get<{ items: InventoryItem[] }>(`/inventory/stores/${storeId}`);

export const createInventoryItem = (storeId: string, data: ItemInput) =>
  apiClient.post<{ item: InventoryItem }>(`/inventory/stores/${storeId}`, data);

export const updateInventoryItem = (id: string, data: Partial<ItemInput>) =>
  apiClient.patch<{ item: InventoryItem }>(`/inventory/${id}`, data);

export const deactivateInventoryItem = (id: string) =>
  apiClient.delete<{ item: InventoryItem }>(`/inventory/${id}`);

export const restockInventoryItem = (id: string, qty: number, reason?: string) =>
  apiClient.post<{ item: InventoryItem }>(`/inventory/${id}/restock`, { qty, reason });

export const listInventoryMovements = (id: string) =>
  apiClient.get<{ movements: InventoryMovementRow[] }>(`/inventory/${id}/movements`);

export const getInventoryAlerts = () =>
  apiClient.get<{ lowStock: number; expiringSoon: number }>("/inventory/alerts");

export const getInventoryAlertItems = () => apiClient.get<InventoryAlertItems>("/inventory/alerts/items");
