import { apiClient } from "./client";
import type { StoreNote } from "../types";

export function listNotes(storeId: string) {
  return apiClient.get<{ notes: StoreNote[] }>(`/stores/${storeId}/notes`);
}

export function createNote(storeId: string, content: string) {
  return apiClient.post<{ note: StoreNote }>(`/stores/${storeId}/notes`, { content });
}

export function deleteNote(id: string) {
  return apiClient.delete<void>(`/store-notes/${id}`);
}
