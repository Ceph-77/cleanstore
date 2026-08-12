import { apiClient } from "./client";
import type { AuthUser } from "../types";

export function login(email: string, password: string) {
  return apiClient.post<{ user: AuthUser }>("/auth/login", { email, password });
}

export function logout() {
  return apiClient.post<void>("/auth/logout");
}

export function me() {
  return apiClient.get<{ user: AuthUser }>("/auth/me");
}
