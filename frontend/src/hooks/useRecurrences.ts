import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/recurrences";
import { POLL_MS } from "../queryClient";

export function useRecurrences() {
  return useQuery({
    queryKey: ["admin", "recurrences"],
    queryFn: () => api.listRecurrences().then((r) => r.recurrences),
    refetchInterval: POLL_MS,
  });
}

export function useSkipRecurrence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, skip }: { id: string; skip: boolean }) => api.skipRecurrence(id, skip),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "recurrences"] }),
  });
}

export function useSetStoreRecurrencePause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ storeId, paused }: { storeId: string; paused: boolean }) =>
      api.setStoreRecurrencePause(storeId, paused),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "recurrences"] });
      qc.invalidateQueries({ queryKey: ["admin", "stores"] });
    },
  });
}
