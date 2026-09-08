import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as claimsAdminApi from "../api/claimsAdmin";
import { POLL_MS } from "../queryClient";
import type { ClaimStatus } from "../types";

export function useStoreClaimsAdmin(status?: ClaimStatus) {
  return useInfiniteQuery({
    queryKey: ["admin", "store-claims", status ?? "all"],
    queryFn: ({ pageParam }) => claimsAdminApi.listStoreClaims(status, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: POLL_MS,
  });
}

export function useDecideStoreClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: "approved" | "rejected"; reason?: string }) =>
      claimsAdminApi.decideStoreClaim(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store-claims"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useTaskClaimsAdmin(status?: ClaimStatus) {
  return useInfiniteQuery({
    queryKey: ["admin", "task-claims", status ?? "all"],
    queryFn: ({ pageParam }) => claimsAdminApi.listTaskClaims(status, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: POLL_MS,
  });
}

export function useDecideTaskClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: "approved" | "rejected"; reason?: string }) =>
      claimsAdminApi.decideTaskClaim(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "task-claims"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}
