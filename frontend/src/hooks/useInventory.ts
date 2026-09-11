import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as inventoryApi from "../api/inventory";
import type { ItemInput } from "../api/inventory";

export function useInventory(storeId: string) {
  return useQuery({
    queryKey: ["stores", storeId, "inventory"],
    queryFn: () => inventoryApi.listInventory(storeId).then((r) => r.items),
    enabled: !!storeId,
  });
}

export function useInventoryMovements(itemId: string | null) {
  return useQuery({
    queryKey: ["inventory", itemId, "movements"],
    queryFn: () => inventoryApi.listInventoryMovements(itemId as string).then((r) => r.movements),
    enabled: !!itemId,
  });
}

export function useInventoryAlerts() {
  return useQuery({
    queryKey: ["inventory", "alerts"],
    queryFn: inventoryApi.getInventoryAlerts,
  });
}

export function useInventoryAlertItems() {
  return useQuery({
    queryKey: ["inventory", "alerts", "items"],
    queryFn: inventoryApi.getInventoryAlertItems,
  });
}

export function useCreateInventoryItem(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ItemInput) => inventoryApi.createInventoryItem(storeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
    },
  });
}

export function useUpdateInventoryItem(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ItemInput> }) =>
      inventoryApi.updateInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
    },
  });
}

export function useDeactivateInventoryItem(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deactivateInventoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
    },
  });
}

export function useRestockInventoryItem(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, qty, reason }: { id: string; qty: number; reason?: string }) =>
      inventoryApi.restockInventoryItem(id, qty, reason),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["stores", storeId, "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", vars.id, "movements"] });
    },
  });
}
