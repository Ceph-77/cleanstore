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

export function useLeaderboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["engagement", "leaderboard"],
    queryFn: () => engagementApi.getLeaderboard().then((r) => r.rows),
    enabled: user?.roleKey === "admin" || user?.roleKey === "sous_traitant",
  });
}
