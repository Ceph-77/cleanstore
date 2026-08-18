import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as myTasksApi from "../api/myTasks";
import type { TaskStatus } from "../types";

export function useMyTasks() {
  return useQuery({
    queryKey: ["marketplace", "my-tasks"],
    queryFn: () => myTasksApi.listMyTasks().then((r) => r.tasks),
    refetchInterval: 10000,
  });
}

export function useUpdateMyTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      status,
      note,
    }: {
      taskId: string;
      status: Extract<TaskStatus, "in_progress" | "completed">;
      note?: string;
    }) => myTasksApi.updateMyTaskStatus(taskId, status, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marketplace", "my-tasks"] }),
  });
}

export function useMyTaskInspection(taskId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["marketplace", "my-tasks", taskId, "inspection"],
    queryFn: () => myTasksApi.getMyTaskInspection(taskId).then((r) => r.inspection),
    enabled,
  });
}
