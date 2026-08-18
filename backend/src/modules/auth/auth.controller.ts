import type { Request, Response } from "express";
import {
  loginSchema,
  registerWorkerSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema";
import {
  authenticate,
  getUserById,
  registerWorker,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
} from "./auth.service";

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid credentials format" });
  }

  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  req.session.userId = user.id;
  req.session.roleKey = user.roleKey ?? undefined;

  res.json({ user });
}

export async function registerWorkerHandler(req: Request, res: Response) {
  const parsed = registerWorkerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const user = await registerWorker(parsed.data);
    req.session.userId = user.id;
    req.session.roleKey = user.roleKey;
    res.status(201).json({ user });
  } catch (err) {
    res.status(409).json({ error: (err as Error).message });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  // Always respond the same way, whether or not the email exists (avoid account enumeration)
  await requestPasswordReset(parsed.data.email).catch(() => {});
  res.json({ message: "If that email exists, a reset link has been sent." });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    await resetPassword(parsed.data.token, parsed.data.newPassword);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export function logout(req: Request, res: Response) {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.status(204).send();
  });
}

export async function me(req: Request, res: Response) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = await getUserById(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({ user });
}

export async function updateMe(req: Request, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const user = await updateProfile(req.session.userId!, parsed.data);
  res.json({ user });
}

export async function changeMyPassword(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    await changePassword(req.session.userId!, parsed.data.currentPassword, parsed.data.newPassword);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}
