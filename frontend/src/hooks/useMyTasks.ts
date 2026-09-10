import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as myTasksApi from "../api/myTasks";
import { POLL_MS } from "../queryClient";
import type { TaskStatus } from "../types";

export function useMyTasks() {
  return useQuery({
    queryKey: ["marketplace", "my-tasks"],
    queryFn: () => myTasksApi.listMyTasks().then((r) => r.tasks),
    refetchInterval: POLL_MS,
  });
}

export function useUpdateMyTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      status,
      note,
      position,
      reportedMetricValue,
      reportedUnits,
      startOdometer,
      endOdometer,
    }: {
      taskId: string;
      status: Extract<TaskStatus, "in_progress" | "completed">;
      note?: string;
      position?: myTasksApi.WorkerPosition;
      reportedMetricValue?: number;
      reportedUnits?: number;
      startOdometer?: number;
      endOdometer?: number;
    }) =>
      myTasksApi.updateMyTaskStatus(taskId, status, note, position, reportedMetricValue, reportedUnits, {
        startOdometer,
        endOdometer,
      }),
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

export function useToggleMyTaskStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, stepId, isDone }: { taskId: string; stepId: string; isDone: boolean }) =>
      myTasksApi.toggleMyTaskStep(taskId, stepId, isDone),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["marketplace", "my-tasks"] }),
  });
}
