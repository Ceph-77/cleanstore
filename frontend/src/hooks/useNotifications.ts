import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notificationsApi from "../api/notifications";
import { POLL_MS } from "../queryClient";

export function useUnseenDecisionsCount() {
  return useQuery({
    queryKey: ["notifications", "unseen-count"],
    queryFn: () => notificationsApi.getUnseenCount().then((r) => r.count),
    refetchInterval: POLL_MS,
  });
}

export function useMarkDecisionsSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markSeen(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", "unseen-count"] }),
  });
}
