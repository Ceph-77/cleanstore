import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as taskInstructionsApi from "../api/taskInstructions";
import type { TaskInstructionsUpdate } from "../api/taskInstructions";

export function useSubcontractorTasks() {
  return useQuery({
    queryKey: ["task-instructions", "mine"],
    queryFn: () => taskInstructionsApi.listMyStoreTasks().then((r) => r.tasks),
  });
}

export function useTaskInstructions(taskId: string, enabled = true) {
  return useQuery({
    queryKey: ["task-instructions", taskId],
    queryFn: () => taskInstructionsApi.getTaskInstructions(taskId).then((r) => r.task),
    enabled: enabled && !!taskId,
  });
}

function useInvalidateInstructions(taskId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["task-instructions", taskId] });
    queryClient.invalidateQueries({ queryKey: ["task-instructions", "mine"] });
  };
}

export function useUpdateTaskInstructions(taskId: string) {
  const invalidate = useInvalidateInstructions(taskId);
  return useMutation({
    mutationFn: (data: TaskInstructionsUpdate) => taskInstructionsApi.updateTaskInstructions(taskId, data),
    onSuccess: invalidate,
  });
}

export function useUploadExpectedPhotos(taskId: string) {
  const invalidate = useInvalidateInstructions(taskId);
  return useMutation({
    mutationFn: (files: File[]) => taskInstructionsApi.uploadExpectedPhotos(taskId, files),
    onSuccess: invalidate,
  });
}

export function useDeleteExpectedPhoto(taskId: string) {
  const invalidate = useInvalidateInstructions(taskId);
  return useMutation({
    mutationFn: (photoId: string) => taskInstructionsApi.deleteExpectedPhoto(taskId, photoId),
    onSuccess: invalidate,
  });
}

export function useAddStep(taskId: string) {
  const invalidate = useInvalidateInstructions(taskId);
  return useMutation({
    mutationFn: (text: string) => taskInstructionsApi.addStep(taskId, text),
    onSuccess: invalidate,
  });
}

export function useUpdateStep(taskId: string) {
  const invalidate = useInvalidateInstructions(taskId);
  return useMutation({
    mutationFn: ({ stepId, text }: { stepId: string; text: string }) =>
      taskInstructionsApi.updateStep(taskId, stepId, text),
    onSuccess: invalidate,
  });
}

export function useDeleteStep(taskId: string) {
  const invalidate = useInvalidateInstructions(taskId);
  return useMutation({
    mutationFn: (stepId: string) => taskInstructionsApi.deleteStep(taskId, stepId),
    onSuccess: invalidate,
  });
}
