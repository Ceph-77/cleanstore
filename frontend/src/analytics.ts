/**
 * Lightweight product-analytics client. Fire-and-forget: never throws, never
 * blocks the UI, silently drops events if the network is down. Events are
 * batched and flushed on a 5s timer, at 10 queued, and when the tab is hidden.
 *
 * Internal use only — this measures where users get stuck in a flow, it is not
 * shown to workers or their sous-traitants.
 */
const ENDPOINT = `${import.meta.env.VITE_API_URL ?? ""}/analytics/track`;

function sessionId(): string {
  try {
    let id = sessionStorage.getItem("cs_sid");
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("cs_sid", id);
    }
    return id;
  } catch {
    return "no-storage";
  }
}

type Props = Record<string, string | number | boolean | null>;
interface Queued {
  name: string;
  path: string;
  sessionId: string;
  props?: Props;
}

let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (queue.length === 0 || !import.meta.env.VITE_API_URL) {
    queue = [];
    return;
  }
  const events = queue;
  queue = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  try {
    void fetch(ENDPOINT, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      keepalive: true, // survives the page being torn down
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

export function track(name: string, props?: Props) {
  try {
    queue.push({ name, path: location.pathname, sessionId: sessionId(), props });
    if (queue.length >= 10) flush();
    else if (!timer) timer = setTimeout(flush, 5000);
  } catch {
    /* ignore */
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}
