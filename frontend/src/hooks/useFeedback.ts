import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as feedbackApi from "../api/feedback";
import type { IncidentSeverity, IncidentType } from "../types";

export function useFeedbackList() {
  return useQuery({
    queryKey: ["admin", "feedback"],
    queryFn: () => feedbackApi.listFeedback().then((r) => r.entries),
  });
}

export function useCreateFeedback() {
  return useMutation({
    mutationFn: (data: feedbackApi.CreateFeedbackInput) => feedbackApi.createFeedback(data),
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feedbackApi.deleteFeedback(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] }),
  });
}

export function useUpdateFeedback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: feedbackApi.FeedbackUpdateInput }) =>
      feedbackApi.updateFeedback(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] }),
  });
}

export function useConvertFeedbackToIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, severity }: { id: string; type: IncidentType; severity: IncidentSeverity }) =>
      feedbackApi.convertFeedbackToIncident(id, type, severity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] }),
  });
}
