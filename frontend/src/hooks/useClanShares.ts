import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/clanShares";

export function useShareClaimsForTask(taskId: string | null) {
  return useQuery({
    queryKey: ["clan-shares", "task", taskId],
    queryFn: () => api.listForTask(taskId as string).then((r) => r.claims),
    enabled: !!taskId,
  });
}

export function useMyShareClaims() {
  return useQuery({
    queryKey: ["clan-shares", "mine"],
    queryFn: () => api.listMine().then((r) => r.claims),
  });
}

export function useClaimableTasks() {
  return useQuery({
    queryKey: ["clan-shares", "claimable"],
    queryFn: () => api.listClaimable().then((r) => r.tasks),
  });
}

export function useCreateShareClaim(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ percent, note, completedStepIds }: { percent: number; note?: string; completedStepIds?: string[] }) =>
      api.createShareClaim(taskId, percent, note, completedStepIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clan-shares", "task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["clan-shares", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["clan-shares", "claimable"] });
    },
  });
}

export function useDecideShareClaim(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, decisionNote }: { id: string; decision: "accepted" | "refused"; decisionNote?: string }) =>
      api.decideShareClaim(id, decision, decisionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clan-shares", "task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useAllShareClaims() {
  return useQuery({
    queryKey: ["clan-shares", "admin", "all"],
    queryFn: () => api.listAll().then((r) => r.claims),
  });
}

export function useInspectorAwardShare() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, percent, decisionNote }: { id: string; percent: number; decisionNote?: string }) =>
      api.inspectorAwardShare(id, percent, decisionNote),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clan-shares"] }),
  });
}
