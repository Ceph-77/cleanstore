import type { RequestHandler } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Standard hardening headers (HSTS, nosniff, frame-deny...). This is a JSON API,
// so CSP is moot; CORP is relaxed because the frontend lives on another origin
// (app.kleanstor.org, plus the old workers.dev URL during the transition) and
// may load files served by the API directly (e.g. <img src>).
export const securityHeaders: RequestHandler = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

// Broad per-IP ceiling for every API call. Generous on purpose: a normal session
// (dashboard polling, messaging, navigation) stays far below it; it only stops
// scripted floods. Per-route limiters (auth, analytics) remain stricter.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

// Uploads (photos, documents) are the most expensive requests — memory-buffered
// by multer and pushed to R2 — so they get their own tighter budget.
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.is("multipart/form-data"),
});
