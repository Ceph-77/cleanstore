import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "../api/messages";

/** Une discussion ouverte se rafraîchit plus vite que le reste de l'app. */
const CHAT_POLL_MS = 8000;

export function useMyThreads() {
  return useQuery({
    queryKey: ["messages", "threads", "mine"],
    queryFn: () => api.listMyThreads().then((r) => r.threads),
    refetchInterval: CHAT_POLL_MS,
  });
}

export function useGlobalThread(kind: "jazzette" | "annonces") {
  return useQuery({
    queryKey: ["messages", "threads", "global", kind],
    queryFn: () => api.getGlobalThread(kind).then((r) => r.thread),
  });
}

export function useTaskThread(taskId: string | null) {
  return useQuery({
    queryKey: ["messages", "threads", "task", taskId],
    queryFn: () => api.getOrCreateTaskThread(taskId as string).then((r) => r.thread),
    enabled: !!taskId,
  });
}

export function useClanThread(clanId: string | null) {
  return useQuery({
    queryKey: ["messages", "threads", "clan", clanId],
    queryFn: () => api.getOrCreateClanThread(clanId as string).then((r) => r.thread),
    enabled: !!clanId,
  });
}

export function useThreadMessages(threadId: string | null) {
  return useInfiniteQuery({
    queryKey: ["messages", "thread", threadId],
    queryFn: ({ pageParam }) => api.listMessages(threadId as string, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    enabled: !!threadId,
    refetchInterval: CHAT_POLL_MS,
  });
}

export function usePostMessage(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.postMessage(threadId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", "thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["messages", "threads", "mine"] });
    },
  });
}

export function useEditMessage(threadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.editMessage(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", "thread", threadId] }),
  });
}

export function useCreateAdhocThread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ participantIds, title }: { participantIds: string[]; title?: string }) =>
      api.createAdhocThread(participantIds, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages", "threads", "mine"] }),
  });
}

export function useAllThreadsAdmin() {
  return useInfiniteQuery({
    queryKey: ["messages", "admin", "threads"],
    queryFn: ({ pageParam }) => api.listAllThreadsAdmin(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}
