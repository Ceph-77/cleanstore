import { apiClient } from "./client";
import type { WalletBalance, WorkerEarning, Withdrawal } from "../types";

export function saveFundingMethod(paymentMethodId: string) {
  return apiClient.post<void>("/payments/funding-method", { paymentMethodId });
}

export function connectOnboard() {
  return apiClient.post<{ url: string }>("/payments/connect/onboard");
}

export function getBalance() {
  return apiClient.get<{ balance: WalletBalance }>("/payments/balance");
}

export function getHistory() {
  return apiClient.get<{ earnings: WorkerEarning[]; withdrawals: Withdrawal[] }>("/payments/history");
}

export function withdraw() {
  return apiClient.post<{ withdrawal: Withdrawal }>("/payments/withdraw");
}

export function getCommissionRate() {
  return apiClient.get<{ commissionRatePercent: string }>("/payments/settings");
}

export function updateCommissionRate(commissionRatePercent: number) {
  return apiClient.patch<{ commissionRatePercent: string }>("/payments/settings", { commissionRatePercent });
}
