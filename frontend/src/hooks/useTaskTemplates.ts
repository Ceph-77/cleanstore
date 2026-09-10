import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/taskTemplates";

export function useTaskTemplates(includeInactive = false) {
  return useQuery({
    queryKey: ["admin", "task-templates", includeInactive ? "all" : "active"],
    queryFn: () => api.listTaskTemplates(includeInactive).then((r) => r.templates),
  });
}

export function useCreateTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: api.TemplateInput) => api.createTaskTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "task-templates"] }),
  });
}

export function useUpdateTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<api.TemplateInput> }) =>
      api.updateTaskTemplate(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "task-templates"] }),
  });
}

export function useDeactivateTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deactivateTaskTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "task-templates"] }),
  });
}

export function useDuplicateTaskTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.duplicateTaskTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "task-templates"] }),
  });
}

export function useInstantiateTemplates(storeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateIds,
      variantByTemplate,
    }: {
      templateIds: string[];
      variantByTemplate?: Record<string, string>;
    }) => api.instantiateTemplates(storeId, templateIds, variantByTemplate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stores", storeId] });
      qc.invalidateQueries({ queryKey: ["stores", storeId, "tasks"] });
    },
  });
}
