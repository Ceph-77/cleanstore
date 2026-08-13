import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as documentsApi from "../api/storeDocuments";

export function useStoreDocuments(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "documents"],
    queryFn: () => documentsApi.listDocuments(storeId).then((r) => r.documents),
    enabled: !!storeId,
  });
}

export function useUploadStoreDocument(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => documentsApi.uploadDocument(storeId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "documents"] }),
  });
}

export function useDeleteStoreDocument(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "documents"] }),
  });
}
