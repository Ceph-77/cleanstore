// Chargé dans le service worker via workbox.importScripts (voir vite.config.ts).
// S'exécute même quand aucun onglet KLEAN'STOR n'est ouvert.

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "KLEAN'STOR", body: event.data.text() };
  }

  const { title, body, url, tag } = payload;
  event.waitUntil(
    self.registration.showNotification(title || "KLEAN'STOR", {
      body,
      tag,
      icon: "/pwa-192.png",
      badge: "/pwa-192.png",
      data: { url: url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.origin === self.location.origin && "focus" in client) {
          client.postMessage({ type: "push-notification-click", url });
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
