import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as storesApi from "../api/stores";
import type { Store } from "../types";

export function useStores() {
  return useQuery({
    queryKey: ["stores"],
    queryFn: () => storesApi.listStores().then((r) => r.stores),
  });
}

export function useStoreMapPoints() {
  return useQuery({
    queryKey: ["stores", "map-points"],
    queryFn: () => storesApi.listStoreMapPoints().then((r) => r.stores),
  });
}

export function useStore(id: string | undefined) {
  return useQuery({
    queryKey: ["stores", id],
    queryFn: () => storesApi.getStore(id!).then((r) => r.store),
    enabled: !!id,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Store>) => storesApi.createStore(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stores"] }),
  });
}

export function useUpdateStore(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Store>) => storesApi.updateStore(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", id] });
    },
  });
}

export function useSetStoreGeofence(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: storesApi.StoreGeofencePayload) => storesApi.setStoreGeofence(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", id] });
    },
  });
}
