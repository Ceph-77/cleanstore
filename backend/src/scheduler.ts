import { runMonthlyRecap } from "./modules/engagement/engagement.service";
import { localDayKey } from "./utils/week";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * In-process scheduler — now a FALLBACK. The primary scheduler is the dedicated
 * Cloudflare Cron Worker (`cron-worker/`), which is precise and independent of
 * Render's sleeping free tier. This keeps running as a harmless safety net; every
 * job it calls is idempotent, so a double run (here + the cron worker) is a no-op.
 */
export function startScheduler() {
  const tick = async () => {
    try {
      // Monthly recap: only bother early in the month. runMonthlyRecap dedupes
      // per worker per period, so firing it a few days in a row is harmless.
      const dayOfMonth = Number(localDayKey(new Date()).slice(-2));
      if (dayOfMonth <= 3) {
        const { sent } = await runMonthlyRecap();
        if (sent > 0) console.log(`[scheduler] monthly recap: ${sent} sent`);
      }
    } catch (err) {
      console.error("[scheduler] tick failed:", err);
    }
  };

  // A little after boot (let the DB connection settle), then once a day.
  setTimeout(tick, 30_000);
  setInterval(tick, DAY_MS);
}
