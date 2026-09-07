// Dedicated Cloudflare Cron Worker for KLEAN'STOR scheduled jobs.
// Replaces the fragile in-process setInterval on Render's free tier: precise,
// free, and independent of the backend's lifecycle.
//
// It only pokes the already-existing, cron-secret-guarded endpoints:
//   POST /api/system/recurrence     — clone due recurring tasks
//   POST /api/system/payout-sweep   — release due earnings / charge subcontractors
//   POST /api/system/monthly-recap  — worker monthly recap

const API_BASE = "https://api.kleanstor.org";

/** Times are UTC. The backend's day logic is UTC-based, so aligning here is correct. */
function jobsFor(date) {
  const h = date.getUTCHours();
  const day = date.getUTCDate();
  const jobs = [];
  if (h === 5) jobs.push("/api/system/recurrence"); // once a day
  if (h % 6 === 0) jobs.push("/api/system/payout-sweep"); // 00:00, 06:00, 12:00, 18:00
  if (day <= 3 && h === 8) jobs.push("/api/system/monthly-recap"); // early each month
  return jobs;
}

export default {
  async scheduled(event, env) {
    if (!env.CRON_SECRET) {
      console.error("CRON_SECRET is not set — set it with `wrangler secret put CRON_SECRET`");
      return;
    }
    const when = new Date(event.scheduledTime);
    const jobs = jobsFor(when);
    for (const path of jobs) {
      try {
        const res = await fetch(API_BASE + path, {
          method: "POST",
          headers: { "x-cron-secret": env.CRON_SECRET },
        });
        const body = await res.text();
        console.log(`${when.toISOString()} ${path} -> ${res.status} ${body.slice(0, 300)}`);
      } catch (err) {
        console.error(`${when.toISOString()} ${path} -> ${String(err)}`);
      }
    }
  },

  // A plain GET is handy for a manual smoke test from the browser / curl.
  async fetch(_req, env) {
    return new Response(
      JSON.stringify({
        worker: "cleanstore-cron",
        cronSecretConfigured: Boolean(env.CRON_SECRET),
        nextJobsSample: jobsFor(new Date()),
      }),
      { headers: { "content-type": "application/json" } }
    );
  },
};
