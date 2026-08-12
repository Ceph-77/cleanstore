import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as tasksApi from "../api/tasks";
import type { Task } from "../types";

export function useTasks(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "tasks"],
    queryFn: () => tasksApi.listTasksForStore(storeId).then((r) => r.tasks),
    enabled: !!storeId,
  });
}

export function useCreateTask(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Task>) => tasksApi.createTask(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["stores", storeId] });
    },
  });
}

export function useUpdateTask(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => tasksApi.updateTask(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "tasks"] }),
  });
}

export function useDeleteTask(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "tasks"] }),
  });
}
