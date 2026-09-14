import { useCallback, useEffect, useState } from "react";
import * as pushApi from "../api/push";

export type PushSupportState = "unsupported" | "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** État de l'abonnement push de cet appareil + actions pour l'activer/désactiver. */
export function usePush() {
  const [state, setState] = useState<PushSupportState>(() =>
    isSupported() ? (Notification.permission as PushSupportState) : "unsupported",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupported()) return;
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {});
  }, []);

  const enable = useCallback(async () => {
    if (!isSupported()) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      setState(permission as PushSupportState);
      if (permission !== "granted") return;

      const { publicKey } = await pushApi.getVapidPublicKey();
      if (!publicKey) {
        setError("Les notifications push ne sont pas encore configurées côté serveur.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        }));

      await pushApi.subscribe(subscription.toJSON() as PushSubscriptionJSON);
      setSubscribed(true);
    } catch {
      setError("Impossible d'activer les notifications sur cet appareil.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    if (!isSupported()) return;
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await pushApi.unsubscribe(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setError("Impossible de désactiver les notifications sur cet appareil.");
    } finally {
      setBusy(false);
    }
  }, []);

  return { supportState: state, subscribed, busy, error, enable, disable };
}
