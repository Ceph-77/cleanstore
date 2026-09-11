import { apiClient } from "./client";
import { pageQuery, type Page } from "./pagination";
import type { Message, MessageThread } from "../types";

export const listMyThreads = () => apiClient.get<{ threads: MessageThread[] }>("/messages/threads/mine");

export const getGlobalThread = (kind: "jazzette" | "annonces") =>
  apiClient.get<{ thread: MessageThread }>(`/messages/threads/global/${kind}`);

export const getOrCreateTaskThread = (taskId: string) =>
  apiClient.get<{ thread: MessageThread }>(`/messages/threads/task/${taskId}`);

export const getOrCreateClanThread = (clanId: string) =>
  apiClient.get<{ thread: MessageThread }>(`/messages/threads/clan/${clanId}`);

export const createAdhocThread = (participantIds: string[], title?: string) =>
  apiClient.post<{ thread: MessageThread }>("/messages/threads/adhoc", { participantIds, title });

export async function listMessages(threadId: string, cursor?: string | null): Promise<Page<Message> & { thread: MessageThread }> {
  const r = await apiClient.get<{ thread: MessageThread; messages: Message[]; nextCursor: string | null }>(
    `/messages/threads/${threadId}/messages${pageQuery(cursor)}`,
  );
  return { thread: r.thread, items: r.messages, nextCursor: r.nextCursor };
}

export const postMessage = (threadId: string, body: string) =>
  apiClient.post<{ message: Message }>(`/messages/threads/${threadId}/messages`, { body });

export const editMessage = (id: string, body: string) =>
  apiClient.patch<{ message: Message }>(`/messages/messages/${id}`, { body });

export async function listAllThreadsAdmin(cursor?: string | null): Promise<Page<MessageThread>> {
  const r = await apiClient.get<{ threads: MessageThread[]; nextCursor: string | null }>(
    `/messages/admin${pageQuery(cursor)}`,
  );
  return { items: r.threads, nextCursor: r.nextCursor };
}
