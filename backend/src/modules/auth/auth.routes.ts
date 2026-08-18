import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  login,
  logout,
  me,
  registerWorkerHandler,
  updateMe,
  changeMyPassword,
  forgotPassword,
  resetPasswordHandler,
} from "./auth.controller";
import { requireAuth } from "./auth.middleware";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post("/login", loginLimiter, login);
authRouter.post("/register-worker", registerLimiter, registerWorkerHandler);
authRouter.post("/logout", logout);
authRouter.get("/me", me);
authRouter.patch("/me", requireAuth, updateMe);
authRouter.patch("/me/password", requireAuth, changeMyPassword);
authRouter.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
authRouter.post("/reset-password", forgotPasswordLimiter, resetPasswordHandler);
