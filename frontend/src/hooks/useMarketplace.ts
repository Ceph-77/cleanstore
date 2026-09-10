import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as marketplaceApi from "../api/marketplace";
import { POLL_MS } from "../queryClient";

export function useAvailableStores() {
  return useQuery({
    queryKey: ["marketplace", "stores"],
    queryFn: () => marketplaceApi.listAvailableStores().then((r) => r.stores),
    refetchInterval: POLL_MS,
  });
}

export function useMyStoreClaims() {
  return useQuery({
    queryKey: ["marketplace", "my-store-claims"],
    queryFn: () => marketplaceApi.listMyStoreClaims().then((r) => r.claims),
    refetchInterval: POLL_MS,
  });
}

export function useClaimStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, note }: { storeId: string; note?: string }) =>
      marketplaceApi.claimStore(storeId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "stores"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "my-store-claims"] });
    },
  });
}

export function useMarketplaceTasks() {
  return useInfiniteQuery({
    queryKey: ["marketplace", "tasks"],
    queryFn: ({ pageParam }) => marketplaceApi.listMarketplaceTasks(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: POLL_MS,
  });
}

export function useMyTaskClaims() {
  return useQuery({
    queryKey: ["marketplace", "my-task-claims"],
    queryFn: () => marketplaceApi.listMyTaskClaims().then((r) => r.claims),
    refetchInterval: POLL_MS,
  });
}

export function useClaimTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, note, clanId }: { taskId: string; note?: string; clanId?: string }) =>
      marketplaceApi.claimTask(taskId, note, clanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace", "my-task-claims"] });
    },
  });
}

export function useAssignableWorkers() {
  return useQuery({
    queryKey: ["marketplace", "assignable-workers"],
    queryFn: () => marketplaceApi.listAssignableWorkers().then((r) => r.workers),
  });
}

export function useDirectAssign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, workerId }: { taskId: string; workerId: string }) =>
      marketplaceApi.directAssignTask(taskId, workerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-instructions", "mine"] });
    },
  });
}
