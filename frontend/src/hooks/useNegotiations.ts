import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/negotiations";
import { POLL_MS } from "../queryClient";
import type { NegotiationStatus } from "../types";

export function useMyNegotiations() {
  return useQuery({
    queryKey: ["negotiations", "mine"],
    queryFn: () => api.listMyNegotiations().then((r) => r.negotiations),
    refetchInterval: POLL_MS,
  });
}

export function useOpenNegotiation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, amount, note, clanId }: { taskId: string; amount: number; note?: string; clanId?: string }) =>
      api.openNegotiation(taskId, amount, note, clanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace", "tasks"] });
      queryClient.invalidateQueries({ queryKey: ["negotiations", "mine"] });
    },
  });
}

export function useAddWorkerOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note?: string }) =>
      api.addWorkerOffer(id, amount, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["negotiations", "mine"] }),
  });
}

export function useNegotiationsAdmin(status: NegotiationStatus | "all") {
  return useInfiniteQuery({
    queryKey: ["negotiations", "admin", status],
    queryFn: ({ pageParam }) => api.listNegotiations(status === "all" ? null : status, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: POLL_MS,
  });
}

function invalidateAdminLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["negotiations", "admin"] });
  queryClient.invalidateQueries({ queryKey: ["marketplace", "tasks"] });
}

export function useAddAdminOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note?: string }) =>
      api.addAdminOffer(id, amount, note),
    onSuccess: () => invalidateAdminLists(queryClient),
  });
}

export function useAcceptNegotiation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount?: number; note?: string }) =>
      api.acceptNegotiation(id, amount, note),
    onSuccess: () => invalidateAdminLists(queryClient),
  });
}

export function useRejectNegotiation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => api.rejectNegotiation(id, reason),
    onSuccess: () => invalidateAdminLists(queryClient),
  });
}
