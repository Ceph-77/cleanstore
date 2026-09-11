import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/contributions";
import type { ContributionStatus } from "../types";

export function useCreateContribution() {
  return useMutation({
    mutationFn: (data: api.CreateContributionInput) => api.createContribution(data),
  });
}

export function useContributionsRegistry() {
  return useQuery({
    queryKey: ["contributions", "registry"],
    queryFn: () => api.listRegistry().then((r) => r.contributions),
  });
}

export function useContributionsAdmin(status?: ContributionStatus | "all") {
  return useQuery({
    queryKey: ["contributions", "admin", status],
    queryFn: () => api.listContributionsAdmin(status && status !== "all" ? status : null).then((r) => r.contributions),
  });
}

export function useDecideContribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: api.DecideContributionInput }) =>
      api.decideContribution(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
  });
}
