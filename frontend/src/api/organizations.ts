import { apiClient } from "./client";
import type { Organization } from "../types";

export function listOrganizations(type?: "grande_compagnie" | "sous_traitant") {
  const query = type ? `?type=${type}` : "";
  return apiClient.get<{ organizations: Organization[] }>(`/organizations${query}`);
}

export function createOrganization(data: Partial<Organization>) {
  return apiClient.post<{ organization: Organization }>("/organizations", data);
}
