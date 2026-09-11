import { useQuery } from "@tanstack/react-query";
import * as api from "../api/rewards";

export function useMyRewards() {
  return useQuery({
    queryKey: ["rewards", "me"],
    queryFn: api.getMyRewards,
  });
}

export function useWorkerRewards(workerId: string | null) {
  return useQuery({
    queryKey: ["rewards", "worker", workerId],
    queryFn: () => api.getWorkerRewards(workerId as string),
    enabled: !!workerId,
  });
}
