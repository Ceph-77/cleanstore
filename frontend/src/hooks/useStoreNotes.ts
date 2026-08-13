import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notesApi from "../api/storeNotes";

export function useStoreNotes(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "notes"],
    queryFn: () => notesApi.listNotes(storeId).then((r) => r.notes),
    enabled: !!storeId,
  });
}

export function useCreateStoreNote(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => notesApi.createNote(storeId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "notes"] }),
  });
}

export function useDeleteStoreNote(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.deleteNote(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "notes"] }),
  });
}
