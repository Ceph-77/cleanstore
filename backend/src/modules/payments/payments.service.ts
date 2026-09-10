import { prisma } from "../../db/prisma";
import { getStripeClient } from "../../utils/stripe";
import { env } from "../../config/env";
import { recordServerEvent } from "../analytics/analytics.service";

const EARNING_HOLD_MS = 24 * 60 * 60 * 1000;
const PASSING_SCORE = 50;

/**
 * Fraction of the task price to pay based on a reported performance metric.
 * No target (or non-positive) → 1 (flat price, unchanged behaviour).
 * Linear pro-rata, capped at 100%: hitting the target or exceeding it pays full.
 * A missing/negative reported value pays nothing.
 */
export function metricPayoutRatio(
  target: number | null | undefined,
  reported: number | null | undefined
): number {
  if (target == null || !Number.isFinite(target) || target <= 0) return 1;
  if (reported == null || !Number.isFinite(reported) || reported < 0) return 0;
  return Math.min(1, reported / target);
}

/** price × ratio, rounded to the cent. */
export function scaleEarning(price: number, ratio: number): number {
  return Math.round(price * ratio * 100) / 100;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export type PaymentModeKey = "fixed" | "hourly" | "per_unit" | "metric_prorata";

export interface GrossInput {
  paymentMode: PaymentModeKey;
  /** Montant forfaitaire / base du prorata. */
  price: number;
  metricTarget?: number | null;
  reportedMetricValue?: number | null;
  hourlyRate?: number | null;
  hourlyCapMinutes?: number | null;
  /** Minutes travaillées confirmées à la complétion (mode hourly). */
  workedMinutes?: number | null;
  unitPrice?: number | null;
  reportedUnits?: number | null;
  /** Tâche publiée en urgence après 15 h : +25 % sur le brut. */
  latePremiumApplied?: boolean | null;
}

/** +25 % pour une tâche d'urgence (publiée après 15 h). */
export const LATE_PREMIUM_RATE = 0.25;

function baseGross(i: GrossInput): number {
  switch (i.paymentMode) {
    case "hourly": {
      if (i.hourlyRate == null || !(i.hourlyRate > 0)) return round2(i.price); // sécurité : jamais 0
      let mins = i.workedMinutes ?? 0;
      if (!(mins > 0)) return 0;
      if (i.hourlyCapMinutes != null && i.hourlyCapMinutes > 0) {
        mins = Math.min(mins, i.hourlyCapMinutes);
      }
      return round2((i.hourlyRate * mins) / 60);
    }
    case "per_unit": {
      const up = i.unitPrice ?? 0;
      const n = i.reportedUnits ?? 0;
      return up > 0 && n > 0 ? round2(up * n) : 0;
    }
    case "metric_prorata":
      return scaleEarning(i.price, metricPayoutRatio(i.metricTarget, i.reportedMetricValue));
    case "fixed":
    default:
      return round2(i.price);
  }
}

/**
 * Montant BRUT dû au travailleur pour une tâche complétée, selon son mode de
 * paiement, + prime d'urgence éventuelle. `fixed` et `metric_prorata` sans
 * urgence = comportement historique inchangé.
 */
export function computeGrossAmount(i: GrossInput): number {
  const base = baseGross(i);
  return i.latePremiumApplied ? round2(base * (1 + LATE_PREMIUM_RATE)) : base;
}

function num(d: { toNumber: () => number } | number | null | undefined): number | null {
  if (d == null) return null;
  return typeof d === "number" ? d : d.toNumber();
}

async function getSubcontractorOrganizationId(userId: string) {
  const userRole = await prisma.userRole.findFirst({
    where: { userId, role: { key: "sous_traitant" } },
  });
  if (!userRole?.organizationId) {
    throw new Error("User is not linked to a sous-traitant organization");
  }
  return userRole.organizationId;
}

async function getPlatformSettings() {
  return prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function getCommissionRate() {
  const settings = await getPlatformSettings();
  return settings.commissionRatePercent;
}

export async function updateCommissionRate(commissionRatePercent: number) {
  return prisma.platformSettings.upsert({
    where: { id: "singleton" },
    update: { commissionRatePercent },
    create: { id: "singleton", commissionRatePercent },
  });
}

export async function saveFundingMethod(userId: string, paymentMethodId: string) {
  const organizationId = await getSubcontractorOrganizationId(userId);
  const organization = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

  const stripe = getStripeClient();
  let customerId = organization.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: organization.name,
      email: organization.contactEmail ?? undefined,
    });
    customerId = customer.id;
  }

  const attached = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: attached.id },
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customerId, stripePaymentMethodId: attached.id },
  });
}

export async function createConnectOnboardingLink(userId: string, returnUrl: string, refreshUrl: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const stripe = getStripeClient();

  let accountId = user.stripeAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: user.email,
      capabilities: {
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    await prisma.user.update({ where: { id: userId }, data: { stripeAccountId: accountId } });
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl,
    refresh_url: refreshUrl,
  });

  return link.url;
}

export async function getBalance(workerId: string) {
  const [pending, available] = await Promise.all([
    prisma.workerEarning.aggregate({
      where: { workerId, status: "pending" },
      _sum: { grossAmount: true },
    }),
    prisma.workerEarning.aggregate({
      where: { workerId, status: "available" },
      _sum: { grossAmount: true },
    }),
  ]);

  return {
    pending: pending._sum.grossAmount ?? 0,
    available: available._sum.grossAmount ?? 0,
  };
}

export function getHistory(workerId: string) {
  return prisma.workerEarning.findMany({
    where: { workerId },
    include: { task: { select: { id: true, description: true, store: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export function getWithdrawalHistory(workerId: string) {
  return prisma.withdrawal.findMany({
    where: { workerId },
    orderBy: { createdAt: "desc" },
  });
}

export async function requestWithdrawal(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.stripeAccountId || !user.stripeOnboardingDone) {
    throw new Error("Connect your bank account before requesting a withdrawal");
  }

  const availableEarnings = await prisma.workerEarning.findMany({
    where: { workerId: userId, status: "available" },
  });
  const grossAmount = availableEarnings.reduce((sum, e) => sum + Number(e.grossAmount), 0);
  if (grossAmount <= 0) {
    throw new Error("No available balance to withdraw");
  }

  const commissionRatePercent = Number(await getCommissionRate());
  const commissionAmount = Math.round(grossAmount * (commissionRatePercent / 100) * 100) / 100;
  const netAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

  const stripe = getStripeClient();

  return prisma.$transaction(async (tx) => {
    const withdrawal = await tx.withdrawal.create({
      data: {
        workerId: userId,
        grossAmount,
        commissionAmount,
        netAmount,
        status: "pending",
      },
    });

    await tx.workerEarning.updateMany({
      where: { id: { in: availableEarnings.map((e) => e.id) } },
      data: { status: "withdrawn", withdrawalId: withdrawal.id },
    });

    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(netAmount * 100),
        currency: "cad",
        destination: user.stripeAccountId!,
      });
      return tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "paid", stripeTransferId: transfer.id },
      });
    } catch (err) {
      await tx.withdrawal.update({ where: { id: withdrawal.id }, data: { status: "failed" } });
      throw err;
    }
  });
}

export async function createEarningForCompletedTask(taskId: string) {
  const task = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { store: { select: { assignedSubcontractorId: true } } },
  });

  if (!task.assignedToId || !task.store.assignedSubcontractorId) {
    return null;
  }

  const existing = await prisma.workerEarning.findUnique({ where: { taskId } });
  if (existing) {
    return existing;
  }

  const grossAmount = computeGrossAmount({
    paymentMode: task.paymentMode as PaymentModeKey,
    price: Number(task.price),
    metricTarget: num(task.metricTarget),
    reportedMetricValue: num(task.reportedMetricValue),
    hourlyRate: num(task.hourlyRate),
    hourlyCapMinutes: task.hourlyCapMinutes,
    workedMinutes: task.workedMinutes,
    unitPrice: num(task.unitPrice),
    reportedUnits: num(task.reportedUnits),
    latePremiumApplied: task.latePremiumApplied,
  });

  return prisma.workerEarning.create({
    data: {
      taskId,
      workerId: task.assignedToId,
      organizationId: task.store.assignedSubcontractorId,
      grossAmount,
      status: "pending",
      availableAt: new Date(Date.now() + EARNING_HOLD_MS),
    },
  });
}

/**
 * Recompute an earning's gross when the reported metric value is corrected
 * (by an inspector). No-op once the earning has been withdrawn.
 */
export async function reevaluateEarningForMetric(taskId: string, reportedValue: number | null) {
  const [earning, task] = await Promise.all([
    prisma.workerEarning.findUnique({ where: { taskId } }),
    prisma.task.findUnique({
      where: { id: taskId },
      select: {
        price: true,
        paymentMode: true,
        metricTarget: true,
        hourlyRate: true,
        hourlyCapMinutes: true,
        workedMinutes: true,
        unitPrice: true,
        reportedUnits: true,
        latePremiumApplied: true,
      },
    }),
  ]);
  if (!earning || earning.status === "withdrawn" || !task) return;

  const grossAmount = computeGrossAmount({
    paymentMode: task.paymentMode as PaymentModeKey,
    price: Number(task.price),
    metricTarget: num(task.metricTarget),
    reportedMetricValue: reportedValue,
    hourlyRate: num(task.hourlyRate),
    hourlyCapMinutes: task.hourlyCapMinutes,
    workedMinutes: task.workedMinutes,
    unitPrice: num(task.unitPrice),
    reportedUnits: num(task.reportedUnits),
    latePremiumApplied: task.latePremiumApplied,
  });
  await prisma.workerEarning.update({ where: { id: earning.id }, data: { grossAmount } });
}

export async function resolveEarningOnInspection(taskId: string, score: number) {
  const earning = await prisma.workerEarning.findUnique({ where: { taskId } });
  if (!earning || earning.status !== "pending") {
    return;
  }
  await prisma.workerEarning.update({
    where: { id: earning.id },
    data: { status: score >= PASSING_SCORE ? "available" : "disputed" },
  });
}

/** Re-evaluate an earning when an inspection score is edited (unless already paid out). */
export async function reevaluateEarningForScore(taskId: string, score: number | null) {
  const earning = await prisma.workerEarning.findUnique({ where: { taskId } });
  if (!earning || earning.status === "withdrawn") return;
  const status = score !== null && score < PASSING_SCORE ? "disputed" : "available";
  await prisma.workerEarning.update({ where: { id: earning.id }, data: { status } });
}

export async function runDuePayouts() {
  const due = await prisma.workerEarning.findMany({
    where: { status: "pending", availableAt: { lte: new Date() } },
    include: { organization: true },
  });

  const stripe = env.STRIPE_SECRET_KEY ? getStripeClient() : null;
  let processed = 0;

  for (const earning of due) {
    let chargeId: string | null = null;

    if (stripe && earning.organization.stripeCustomerId && earning.organization.stripePaymentMethodId) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(Number(earning.grossAmount) * 100),
          currency: "cad",
          customer: earning.organization.stripeCustomerId,
          payment_method: earning.organization.stripePaymentMethodId,
          off_session: true,
          confirm: true,
        });
        chargeId = paymentIntent.id;
      } catch {
        // Charge failed (e.g. card declined) — leave the earning pending for manual follow-up
        // rather than marking it available with no funds actually collected.
        continue;
      }
    }

    await prisma.workerEarning.update({
      where: { id: earning.id },
      data: { status: "available", chargeId },
    });
    void recordServerEvent("earning_paid", {
      userId: earning.workerId,
      role: "travailleur",
      props: { taskId: earning.taskId },
    }).catch(() => {});
    processed += 1;
  }

  return processed;
}

export async function handleAccountUpdated(stripeAccountId: string, onboardingDone: boolean) {
  await prisma.user.updateMany({
    where: { stripeAccountId },
    data: { stripeOnboardingDone: onboardingDone },
  });
}
