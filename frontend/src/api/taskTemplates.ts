import { apiClient } from "./client";
import type { PaymentMode, Task, TaskTemplate } from "../types";

export interface TemplateInput {
  name: string;
  description: string;
  taskType?: string;
  defaultPrice?: number | null;
  isNegotiable?: boolean;
  isRecurringDefault?: boolean;
  expectedResultText?: string;
  howToText?: string;
  requiredEquipment?: string[];
  estimatedDurationMinutes?: number | null;
  metricLabel?: string | null;
  metricUnit?: string | null;
  defaultMetricTarget?: number | null;
  paymentMode?: PaymentMode;
  hourlyRate?: number | null;
  hourlyCapMinutes?: number | null;
  unitPrice?: number | null;
  unitLabel?: string | null;
  requiresOdometer?: boolean;
  isActive?: boolean;
  steps?: string[];
}

export function listTaskTemplates(includeInactive = false) {
  return apiClient.get<{ templates: TaskTemplate[] }>(
    `/task-templates${includeInactive ? "?all=1" : ""}`
  );
}

export function createTaskTemplate(data: TemplateInput) {
  return apiClient.post<{ template: TaskTemplate }>("/task-templates", data);
}

export function updateTaskTemplate(id: string, data: Partial<TemplateInput>) {
  return apiClient.patch<{ template: TaskTemplate }>(`/task-templates/${id}`, data);
}

export function deactivateTaskTemplate(id: string) {
  return apiClient.delete<void>(`/task-templates/${id}`);
}

export function instantiateTemplates(storeId: string, templateIds: string[]) {
  return apiClient.post<{ tasks: Task[] }>("/task-templates/instantiate", { storeId, templateIds });
}
