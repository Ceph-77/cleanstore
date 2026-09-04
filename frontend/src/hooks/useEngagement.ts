import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as engagementApi from "../api/engagement";
import { useAuth } from "../context/AuthContext";

export function useMyEngagement() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["engagement", "me"],
    queryFn: () => engagementApi.getMySummary().then((r) => r.summary),
    enabled: user?.roleKey === "travailleur",
  });
}

export function useUnseenMoments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["engagement", "moments", "unseen"],
    queryFn: () => engagementApi.getUnseenMoments().then((r) => r.moments),
    enabled: user?.roleKey === "travailleur",
    refetchInterval: 15000,
  });
}

export function useMarkMomentSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => engagementApi.markMomentSeen(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement", "moments", "unseen"] });
      queryClient.invalidateQueries({ queryKey: ["engagement", "me"] });
    },
  });
}

export function useStreak() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["engagement", "streak"],
    queryFn: () => engagementApi.getStreak(),
    enabled: user?.roleKey === "travailleur",
  });
}

export function useStreakDay(date: string | null) {
  return useQuery({
    queryKey: ["engagement", "streak", date],
    queryFn: () => engagementApi.getStreakDay(date!),
    enabled: !!date,
  });
}

export function useWorkerSummary(workerId: string) {
  return useQuery({
    queryKey: ["engagement", "worker", workerId, "summary"],
    queryFn: () => engagementApi.getWorkerSummary(workerId).then((r) => r.summary),
    enabled: !!workerId,
  });
}

export function useWorkerStreak(workerId: string) {
  return useQuery({
    queryKey: ["engagement", "worker", workerId, "streak"],
    queryFn: () => engagementApi.getWorkerStreak(workerId),
    enabled: !!workerId,
  });
}

export function useWorkerStreakDay(workerId: string, date: string | null) {
  return useQuery({
    queryKey: ["engagement", "worker", workerId, "streak", date],
    queryFn: () => engagementApi.getWorkerStreakDay(workerId, date!),
    enabled: !!workerId && !!date,
  });
}

export function useAddPastTask(workerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: engagementApi.PastTaskInput) => engagementApi.addPastTask(workerId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["engagement", "worker", workerId] }),
  });
}

export function useUpdatePastTask(workerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, patch }: { taskId: string; patch: engagementApi.PastTaskPatch }) =>
      engagementApi.updatePastTask(workerId, taskId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["engagement", "worker", workerId] }),
  });
}

export function useDeletePastTask(workerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => engagementApi.deletePastTask(workerId, taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["engagement", "worker", workerId] }),
  });
}

export function useLeaderboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["engagement", "leaderboard"],
    queryFn: () => engagementApi.getLeaderboard().then((r) => r.rows),
    enabled: user?.roleKey === "admin" || user?.roleKey === "sous_traitant",
  });
}
