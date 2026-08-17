import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as marketplaceApi from "../api/marketplace";

export function useAvailableStores() {
  return useQuery({
    queryKey: ["marketplace", "stores"],
    queryFn: () => marketplaceApi.listAvailableStores().then((r) => r.stores),
  });
}

export function useMyStoreClaims() {
  return useQuery({
    queryKey: ["marketplace", "my-store-claims"],
    queryFn: () => marketplaceApi.listMyStoreClaims().then((r) => r.claims),
  });
}

export function useClaimStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (storeId: string) => marketplaceApi.claimStore(storeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "stores"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "my-store-claims"] });
    },
  });
}

export function useMarketplaceTasks() {
  return useQuery({
    queryKey: ["marketplace", "tasks"],
    queryFn: () => marketplaceApi.listMarketplaceTasks().then((r) => r.tasks),
  });
}

export function useMyTaskClaims() {
  return useQuery({
    queryKey: ["marketplace", "my-task-claims"],
    queryFn: () => marketplaceApi.listMyTaskClaims().then((r) => r.claims),
  });
}

export function useClaimTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => marketplaceApi.claimTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "my-task-claims"] });
    },
  });
}
