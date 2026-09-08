import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireRole } from "../auth/auth.middleware";
import * as analyticsController from "./analytics.controller";

// Ingest is open (funnel steps happen before login) but capped hard per IP.
const trackLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

export const analyticsRouter = Router();
analyticsRouter.post("/track", trackLimiter, analyticsController.track);

export const analyticsAdminRouter = Router();
analyticsAdminRouter.use(requireRole("admin"));
analyticsAdminRouter.get("/overview", analyticsController.overview);
analyticsAdminRouter.get("/recent", analyticsController.recent);
analyticsAdminRouter.get("/export.csv", analyticsController.exportCsv);
