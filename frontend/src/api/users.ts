import { apiClient } from "./client";
import type { AppUser, RoleKey } from "../types";

export function listUsers(role?: RoleKey) {
  const query = role ? `?role=${role}` : "";
  return apiClient.get<{ users: AppUser[] }>(`/users${query}`);
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
