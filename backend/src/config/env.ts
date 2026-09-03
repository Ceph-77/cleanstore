import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  PORT: z.coerce.number().default(4000),
  // One or more allowed frontend origins, comma-separated. The first one is the
  // canonical URL used to build links (password reset, Stripe return_url, …);
  // all of them are accepted by CORS — handy while migrating to a new domain.
  FRONTEND_URL: z.string().min(1, "FRONTEND_URL is required"),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  // Accepts a bare address (no-reply@x.com) or an RFC 5322 "Name <addr>" form,
  // both of which Resend's `from` field takes.
  RESEND_FROM_EMAIL: z
    .string()
    .refine((v) => {
      const s = v.trim();
      const addr = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return addr.test(s) || /<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(s);
    }, 'RESEND_FROM_EMAIL must be an email or "Name <email>"')
    .optional(),
  CRON_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

const frontendUrls = parsed.FRONTEND_URL.split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);

export const env = {
  ...parsed,
  /** Canonical frontend URL, for building outbound links. */
  FRONTEND_URL: frontendUrls[0],
  /** Every allowed frontend origin, for CORS. */
  FRONTEND_URLS: frontendUrls,
};
