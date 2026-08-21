import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as paymentsApi from "../api/payments";

export function useWalletBalance() {
  return useQuery({
    queryKey: ["payments", "balance"],
    queryFn: () => paymentsApi.getBalance().then((r) => r.balance),
    refetchInterval: 15000,
  });
}

export function useWalletHistory() {
  return useQuery({
    queryKey: ["payments", "history"],
    queryFn: () => paymentsApi.getHistory(),
    refetchInterval: 15000,
  });
}

export function useConnectOnboard() {
  return useMutation({
    mutationFn: () => paymentsApi.connectOnboard(),
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => paymentsApi.withdraw(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments", "balance"] });
      queryClient.invalidateQueries({ queryKey: ["payments", "history"] });
    },
  });
}

export function useSaveFundingMethod() {
  return useMutation({
    mutationFn: (paymentMethodId: string) => paymentsApi.saveFundingMethod(paymentMethodId),
  });
}

export function useCommissionRate() {
  return useQuery({
    queryKey: ["payments", "commission-rate"],
    queryFn: () => paymentsApi.getCommissionRate().then((r) => r.commissionRatePercent),
  });
}

export function useUpdateCommissionRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rate: number) => paymentsApi.updateCommissionRate(rate),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments", "commission-rate"] }),
  });
}
