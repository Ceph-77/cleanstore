import { apiClient } from "./client";

export function getVapidPublicKey() {
  return apiClient.get<{ publicKey: string | null }>("/notifications/push/vapid-public-key");
}

export function subscribe(subscription: PushSubscriptionJSON) {
  return apiClient.post<void>("/notifications/push/subscribe", subscription);
}

export function unsubscribe(endpoint: string) {
  return apiClient.post<void>("/notifications/push/unsubscribe", { endpoint });
}
