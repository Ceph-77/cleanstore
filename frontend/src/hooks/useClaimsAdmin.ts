import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as claimsAdminApi from "../api/claimsAdmin";
import type { ClaimStatus } from "../types";

export function useStoreClaimsAdmin(status?: ClaimStatus) {
  return useQuery({
    queryKey: ["admin", "store-claims", status ?? "all"],
    queryFn: () => claimsAdminApi.listStoreClaims(status).then((r) => r.claims),
    refetchInterval: 10000,
  });
}

export function useDecideStoreClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      claimsAdminApi.decideStoreClaim(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "store-claims"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

export function useTaskClaimsAdmin(status?: ClaimStatus) {
  return useQuery({
    queryKey: ["admin", "task-claims", status ?? "all"],
    queryFn: () => claimsAdminApi.listTaskClaims(status).then((r) => r.claims),
    refetchInterval: 10000,
  });
}

export function useDecideTaskClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      claimsAdminApi.decideTaskClaim(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "task-claims"] });
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}
