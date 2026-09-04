import { apiClient } from "./client";
import type { AppUser, RoleKey } from "../types";

export function listUsers(role?: RoleKey) {
  const query = role ? `?role=${role}` : "";
  return apiClient.get<{ users: AppUser[] }>(`/users${query}`);
}

export function getUser(id: string) {
  return apiClient.get<{ user: AppUser }>(`/users/${id}`);
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: "sous_traitant" | "travailleur";
  organizationId?: string;
}

export function createUser(data: CreateUserInput) {
  return apiClient.post<{ user: AppUser }>("/users", data);
}

export function setUserActive(id: string, isActive: boolean) {
  return apiClient.patch<{ user: AppUser }>(`/users/${id}`, { isActive });
}

export function deleteUser(id: string) {
  return apiClient.delete<{ deleted: { id: string; email: string } }>(`/users/${id}`);
}
