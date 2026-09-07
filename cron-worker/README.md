# cleanstore-cron

Cloudflare Cron Worker that drives KLEAN'STOR's scheduled jobs, replacing the
in-process `setInterval` in the backend (fragile on Render's sleeping free tier).

It calls the existing, `x-cron-secret`-guarded endpoints on
`https://api.kleanstor.org`:

| UTC time           | Endpoint                       | Job                                    |
| ------------------ | ------------------------------ | -------------------------------------- |
| 05:00 daily        | `POST /api/system/recurrence`  | clone due recurring tasks              |
| 00/06/12/18:00     | `POST /api/system/payout-sweep`| release due earnings, charge ST cards  |
| 08:00 on days 1–3  | `POST /api/system/monthly-recap`| worker monthly recap                  |

One hourly cron trigger; `src/worker.js` decides which job(s) to run from the
scheduled time.

## Deploy

```
cd cron-worker
npx wrangler secret put CRON_SECRET   # paste the same value as Render's CRON_SECRET
npx wrangler deploy
```

Check it: `npx wrangler tail cleanstore-cron` (live logs), or open the worker URL
for a status JSON. The in-process scheduler in the backend stays as a harmless
idempotent fallback.
