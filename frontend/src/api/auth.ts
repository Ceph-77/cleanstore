import { apiClient } from "./client";
import type { AuthUser } from "../types";

export function login(email: string, password: string) {
  return apiClient.post<{ user: AuthUser }>("/auth/login", { email, password });
}

export interface RegisterWorkerInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  acceptedTerms: boolean;
}

export function registerWorker(data: RegisterWorkerInput) {
  return apiClient.post<{ user: AuthUser }>("/auth/register-worker", data);
}

export function logout() {
  return apiClient.post<void>("/auth/logout");
}

export function me() {
  return apiClient.get<{ user: AuthUser; impersonating: boolean }>("/auth/me");
}

export function impersonate(userId: string) {
  return apiClient.post<{ user: AuthUser }>(`/auth/impersonate/${userId}`);
}

export function stopImpersonating() {
  return apiClient.post<{ user: AuthUser }>("/auth/stop-impersonating");
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  address?: string;
}

export function updateProfile(data: UpdateProfileInput) {
  return apiClient.patch<{ user: AuthUser }>("/auth/me", data);
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiClient.patch<void>("/auth/me/password", { currentPassword, newPassword });
}

export function forgotPassword(email: string) {
  return apiClient.post<{ message: string }>("/auth/forgot-password", { email });
}

export function resetPassword(token: string, newPassword: string) {
  return apiClient.post<void>("/auth/reset-password", { token, newPassword });
}

export function acceptTerms() {
  return apiClient.post<{ user: AuthUser }>("/auth/accept-terms");
}
