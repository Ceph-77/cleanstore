import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as taskInspectionsApi from "../api/taskInspections";

export function useTaskInspection(taskId: string) {
  return useQuery({
    queryKey: ["tasks", taskId, "inspection"],
    queryFn: () => taskInspectionsApi.getTaskInspection(taskId).then((r) => r.inspection),
    enabled: !!taskId,
  });
}

export function useCreateTaskInspection(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      data,
      photosBefore,
      photosAfter,
    }: {
      taskId: string;
      data: { score: number; notes: string };
      photosBefore: File[];
      photosAfter: File[];
    }) => taskInspectionsApi.createTaskInspection(taskId, data, photosBefore, photosAfter),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "inspection"] });
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["stores", storeId] });
    },
  });
}
