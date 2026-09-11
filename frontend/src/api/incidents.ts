import { apiClient } from "./client";
import { pageQuery, type Page } from "./pagination";
import type { Incident, IncidentSeverity, IncidentStatus, IncidentType } from "../types";

export interface CreateIncidentInput {
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  storeId?: string | null;
  taskId?: string | null;
}

export const createIncident = (data: CreateIncidentInput) =>
  apiClient.post<{ incident: Incident }>("/incidents", data);

export async function listIncidents(
  status?: IncidentStatus | null,
  severity?: IncidentSeverity | null,
  cursor?: string | null,
): Promise<Page<Incident>> {
  const r = await apiClient.get<{ incidents: Incident[]; nextCursor: string | null }>(
    `/incidents${pageQuery(cursor, { status, severity })}`,
  );
  return { items: r.incidents, nextCursor: r.nextCursor };
}

export const getIncident = (id: string) => apiClient.get<{ incident: Incident }>(`/incidents/${id}`);

export interface UpdateIncidentInput {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  assignedToId?: string | null;
}

export const updateIncident = (id: string, data: UpdateIncidentInput) =>
  apiClient.patch<{ incident: Incident }>(`/incidents/${id}`, data);

export const addIncidentNote = (id: string, body: string) =>
  apiClient.post<{ incident: Incident }>(`/incidents/${id}/notes`, { body });
