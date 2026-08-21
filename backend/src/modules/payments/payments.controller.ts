import type { Request, Response } from "express";
import { savePaymentMethodSchema, commissionRateUpdateSchema } from "./payments.schema";
import * as paymentsService from "./payments.service";
import { env } from "../../config/env";
import { getStripeClient, isStripeConfigured } from "../../utils/stripe";

export async function saveFundingMethod(req: Request, res: Response) {
  const parsed = savePaymentMethodSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  try {
    await paymentsService.saveFundingMethod(req.session.userId!, parsed.data.paymentMethodId);
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function connectOnboard(req: Request, res: Response) {
  try {
    const url = await paymentsService.createConnectOnboardingLink(
      req.session.userId!,
      `${env.FRONTEND_URL}/wallet`,
      `${env.FRONTEND_URL}/wallet`
    );
    res.json({ url });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function getBalance(req: Request, res: Response) {
  const balance = await paymentsService.getBalance(req.session.userId!);
  res.json({ balance });
}

export async function getHistory(req: Request, res: Response) {
  const [earnings, withdrawals] = await Promise.all([
    paymentsService.getHistory(req.session.userId!),
    paymentsService.getWithdrawalHistory(req.session.userId!),
  ]);
  res.json({ earnings, withdrawals });
}

export async function withdraw(req: Request, res: Response) {
  try {
    const withdrawal = await paymentsService.requestWithdrawal(req.session.userId!);
    res.status(201).json({ withdrawal });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function getSettings(req: Request, res: Response) {
  const commissionRatePercent = await paymentsService.getCommissionRate();
  res.json({ commissionRatePercent });
}

export async function updateSettings(req: Request, res: Response) {
  const parsed = commissionRateUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const settings = await paymentsService.updateCommissionRate(parsed.data.commissionRatePercent);
  res.json({ commissionRatePercent: settings.commissionRatePercent });
}

export async function webhook(req: Request, res: Response) {
  if (!isStripeConfigured() || !env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send();
  }

  const signature = req.headers["stripe-signature"] as string | undefined;
  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(req.body, signature!, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature verification failed: ${(err as Error).message}` });
  }

  if (event.type === "account.updated") {
    const account = event.data.object as { id: string; details_submitted: boolean; charges_enabled: boolean };
    await paymentsService.handleAccountUpdated(account.id, account.details_submitted && account.charges_enabled);
  }

  res.json({ received: true });
}
