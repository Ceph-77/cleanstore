import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as invoicesApi from "../api/storeInvoices";
import type { StoreInvoice } from "../types";

export function useStoreInvoices(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "invoices"],
    queryFn: () => invoicesApi.listInvoices(storeId).then((r) => r.invoices),
    enabled: !!storeId,
  });
}

export function useCreateStoreInvoice(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StoreInvoice>) => invoicesApi.createInvoice(storeId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "invoices"] }),
  });
}

export function useUpdateStoreInvoice(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StoreInvoice> }) => invoicesApi.updateInvoice(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "invoices"] }),
  });
}

export function useDeleteStoreInvoice(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.deleteInvoice(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores", storeId, "invoices"] }),
  });
}
