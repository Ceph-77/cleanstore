import { apiClient } from "./client";
import type { StoreInvoice } from "../types";

export function listInvoices(storeId: string) {
  return apiClient.get<{ invoices: StoreInvoice[] }>(`/stores/${storeId}/invoices`);
}

export function createInvoice(storeId: string, data: Partial<StoreInvoice>) {
  return apiClient.post<{ invoice: StoreInvoice }>(`/stores/${storeId}/invoices`, data);
}

export function updateInvoice(id: string, data: Partial<StoreInvoice>) {
  return apiClient.patch<{ invoice: StoreInvoice }>(`/store-invoices/${id}`, data);
}

export function deleteInvoice(id: string) {
  return apiClient.delete<void>(`/store-invoices/${id}`);
}
