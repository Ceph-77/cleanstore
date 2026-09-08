// Loaded FIRST (before any other import) from src/index.ts so Sentry can
// auto-instrument http/express. No-op when SENTRY_DSN is unset, like the app's
// other optional integrations.
import * as Sentry from "@sentry/node";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? "development",
    // Modest trace sampling — enough to spot slow endpoints, cheap on the free tier.
    tracesSampleRate: 0.1,
    // Don't attach request bodies / user identifiers by default.
    sendDefaultPii: false,
  });
}

export const sentryEnabled = Boolean(dsn);
