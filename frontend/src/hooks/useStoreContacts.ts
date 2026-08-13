import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as contactsApi from "../api/storeContacts";
import type { StoreContact } from "../types";

export function useStoreContacts(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "contacts"],
    queryFn: () => contactsApi.listContacts(storeId).then((r) => r.contacts),
    enabled: !!storeId,
  });
}

export function useCreateStoreContact(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StoreContact>) => contactsApi.createContact(storeId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "contacts"] }),
  });
}

export function useDeleteStoreContact(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.deleteContact(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "contacts"] }),
  });
}
