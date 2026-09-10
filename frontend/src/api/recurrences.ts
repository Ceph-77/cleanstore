import { apiClient } from "./client";

export interface RecurrenceRow {
  id: string;
  description: string;
  taskType: string | null;
  price: string;
  isPublished: boolean;
  recurrenceSkipDate: string | null;
  lastRecurredOn: string | null;
  store: {
    id: string;
    name: string;
    city: string | null;
    recurrencePaused: boolean;
    isActive: boolean;
  };
  todayInstance: {
    id: string;
    status: string;
    price: string;
    assignedToId: string | null;
    visibleFrom: string | null;
  } | null;
}

export const listRecurrences = () =>
  apiClient.get<{ recurrences: RecurrenceRow[] }>("/tasks/recurrences");

export const skipRecurrence = (id: string, skip: boolean) =>
  apiClient.post<{ task: unknown }>(`/tasks/${id}/skip-recurrence`, { skip });

export const setStoreRecurrencePause = (storeId: string, paused: boolean) =>
  apiClient.patch<{ store: unknown }>(`/stores/${storeId}/recurrence-pause`, { paused });
