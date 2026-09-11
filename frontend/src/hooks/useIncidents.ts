import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/incidents";
import type { IncidentSeverity, IncidentStatus } from "../types";

export function useCreateIncident() {
  return useMutation({
    mutationFn: (data: api.CreateIncidentInput) => api.createIncident(data),
  });
}

export function useIncidents(status?: IncidentStatus | "all", severity?: IncidentSeverity | "all") {
  return useInfiniteQuery({
    queryKey: ["incidents", status, severity],
    queryFn: ({ pageParam }) =>
      api.listIncidents(
        status && status !== "all" ? status : null,
        severity && severity !== "all" ? severity : null,
        pageParam,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useIncident(id: string | null) {
  return useQuery({
    queryKey: ["incidents", id],
    queryFn: () => api.getIncident(id as string).then((r) => r.incident),
    enabled: !!id,
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: api.UpdateIncidentInput }) => api.updateIncident(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}

export function useAddIncidentNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.addIncidentNote(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["incidents"] }),
  });
}
