import webpush from "web-push";
import { prisma } from "../../db/prisma";
import { env } from "../../config/env";

let configured = false;

export function isPushConfigured() {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return false;
  if (!configured) {
    webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
    configured = true;
  }
  return true;
}

export function getVapidPublicKey() {
  return env.VAPID_PUBLIC_KEY ?? null;
}

export function saveSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string,
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, userAgent },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
    },
  });
}

export async function removeSubscription(userId: string, endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
}

export type PushPayload = {
  title: string;
  body: string;
  /** Chemin frontend ouvert au clic (ex. "/messages/xyz"). Défaut : "/". */
  url?: string;
  tag?: string;
};

/** Envoie à tous les appareils d'un utilisateur ; retire les abonnements expirés (404/410). */
export async function sendPush(userId: string, payload: PushPayload) {
  if (!isPushConfigured()) return;

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error(`[push] send failed for user ${userId}:`, err);
        }
      }
    }),
  );
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const uniqueIds = [...new Set(userIds)];
  await Promise.all(uniqueIds.map((userId) => sendPush(userId, payload)));
}
