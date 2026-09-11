import { apiClient } from "./client";
import { pageQuery, type Page } from "./pagination";
import type { NegotiationStatus, TaskNegotiation } from "../types";

// Côté travailleur (préfixe /marketplace)
export function openNegotiation(taskId: string, amount: number, note?: string, clanId?: string) {
  return apiClient.post<{ negotiation: TaskNegotiation }>(`/marketplace/tasks/${taskId}/negotiations`, {
    amount,
    note,
    clanId,
  });
}

export function addWorkerOffer(id: string, amount: number, note?: string) {
  return apiClient.post<{ negotiation: TaskNegotiation }>(`/marketplace/negotiations/${id}/offers`, {
    amount,
    note,
  });
}

export function listMyNegotiations() {
  return apiClient.get<{ negotiations: TaskNegotiation[] }>("/marketplace/my-negotiations");
}

// Côté gestion (préfixe /negotiations)
export async function listNegotiations(status?: NegotiationStatus | null, cursor?: string | null): Promise<Page<TaskNegotiation>> {
  const r = await apiClient.get<{ negotiations: TaskNegotiation[]; nextCursor: string | null }>(
    `/negotiations${pageQuery(cursor, { status })}`,
  );
  return { items: r.negotiations, nextCursor: r.nextCursor };
}

export function addAdminOffer(id: string, amount: number, note?: string) {
  return apiClient.post<{ negotiation: TaskNegotiation }>(`/negotiations/${id}/offers`, { amount, note });
}

export function acceptNegotiation(id: string, amount?: number, note?: string) {
  return apiClient.post<{ negotiation: TaskNegotiation }>(`/negotiations/${id}/accept`, { amount, note });
}

export function rejectNegotiation(id: string, reason?: string) {
  return apiClient.post<{ negotiation: TaskNegotiation }>(`/negotiations/${id}/reject`, { reason });
}
