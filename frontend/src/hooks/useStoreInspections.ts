import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as storeInspectionsApi from "../api/storeInspections";
import type { ChecklistItem } from "../types";

export function useStoreInspections(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "inspections"],
    queryFn: () => storeInspectionsApi.listStoreInspections(storeId).then((r) => r.inspections),
    enabled: !!storeId,
  });
}

export function useUpdateStoreInspection(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { score?: number; notes?: string | null; checklist?: ChecklistItem[] };
    }) => storeInspectionsApi.updateStoreInspection(storeId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "inspections"] }),
  });
}

export function useCreateStoreInspection(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      data,
      photosBefore,
      photosAfter,
    }: {
      data: { score: number; notes: string; checklist: ChecklistItem[] };
      photosBefore: File[];
      photosAfter: File[];
    }) => storeInspectionsApi.createStoreInspection(storeId, data, photosBefore, photosAfter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "inspections"] }),
  });
}
