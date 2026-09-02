import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as feedbackApi from "../api/feedback";

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
