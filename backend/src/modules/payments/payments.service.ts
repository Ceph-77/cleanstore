import { prisma } from "../../db/prisma";
import { getStripeClient } from "../../utils/stripe";
import { env } from "../../config/env";
import { recordServerEvent } from "../analytics/analytics.service";
import { recordLedgerEntry } from "../ledger/ledger.service";

const EARNING_HOLD_MS = 24 * 60 * 60 * 1000;
const PASSING_SCORE = 50;
/** Même seuil que le bonus de points (POINTS.QUALITY_MIN_SCORE) — un score
 * d'inspection exceptionnel ajoute aussi un petit bonus $ automatique. */
const QUALITY_BONUS_SCORE = 90;
const QUALITY_BONUS_PCT = 5;

/**
 * "Le" gain d'une tâche, au sens où l'entend tout le code écrit avant le
 * partage de clan (Lot 3c) : celui du réservateur (`Task.assignedToId`), PAS
 * un éventuel gain transféré à un coéquipier (voir `clanShares.service` —
 * chaque transfert accepté crée sa PROPRE ligne `WorkerEarning`, réglée une
 * fois pour toutes, jamais réévaluée par l'inspection/un incident/un
 * ajustement). `WorkerEarning.taskId` n'est donc plus unique à lui seul —
 * `@@unique([taskId, workerId])` retrouve précisément CETTE ligne.
 */
async function getPrimaryEarning(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { assignedToId: true } });
  if (!task?.assignedToId) return null;
  return prisma.workerEarning.findUnique({
    where: { taskId_workerId: { taskId, workerId: task.assignedToId } },
  });
}

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
      const paid = await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: { status: "paid", stripeTransferId: transfer.id },
      });
      recordLedgerEntry({
        type: "commission",
        amount: commissionAmount,
        partyAId: userId,
        partyAType: "user",
        reason: `${commissionRatePercent}% au retrait`,
      });
      recordLedgerEntry({
        type: "retrait",
        amount: netAmount,
        partyAId: userId,
        partyAType: "user",
        reason: `Stripe ${transfer.id}`,
      });
      return paid;
    } catch (err) {
      await tx.withdrawal.update({ where: { id: withdrawal.id }, data: { status: "failed" } });
      recordLedgerEntry({
        type: "retrait_echoue",
        amount: netAmount,
        partyAId: userId,
        partyAType: "user",
        reason: (err as Error).message,
      });
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

  const existing = await prisma.workerEarning.findUnique({
    where: { taskId_workerId: { taskId, workerId: task.assignedToId } },
  });
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

  const earning = await prisma.workerEarning.create({
    data: {
      taskId,
      workerId: task.assignedToId,
      organizationId: task.store.assignedSubcontractorId,
      grossAmount,
      status: "pending",
      availableAt: new Date(Date.now() + EARNING_HOLD_MS),
    },
  });

  recordLedgerEntry({
    type: "gain_cree",
    amount: grossAmount,
    partyAId: task.assignedToId,
    partyAType: "user",
    taskId,
    reason: "Tâche complétée",
  });

  // Un incident majeur/urgence a déjà été signalé sur cette tâche avant même
  // sa complétion (rare mais possible) — le gain naît directement suspendu.
  const openIncident = await prisma.incident.findFirst({
    where: {
      taskId,
      severity: { in: ["majeur", "urgence"] },
      status: { in: ["ouverte", "en_traitement"] },
    },
  });
  if (openIncident) {
    await holdEarningForIncident(taskId, openIncident.id);
  }

  return earning;
}

/**
 * Suspend le gain d'une tâche parce qu'un incident majeur/urgence la
 * concerne (Q41-43 : "gain suspendu jusqu'à revue"). Distinct du statut
 * "disputed" posé par un mauvais score d'inspection — `heldForIncidentId`
 * trace la raison précise pour que résoudre l'incident ne libère jamais par
 * erreur un gain suspendu pour une AUTRE raison. No-op si le gain n'existe
 * pas encore (tâche pas complétée) ou est déjà retiré.
 */
export async function holdEarningForIncident(taskId: string, incidentId: string) {
  const earning = await getPrimaryEarning(taskId);
  if (!earning || earning.status === "withdrawn") return;
  await prisma.workerEarning.update({
    where: { id: earning.id },
    data: { status: "disputed", heldForIncidentId: incidentId },
  });
}

/**
 * Un incident résolu libère les gains qu'il tenait suspendus — mais recalcule
 * l'état "naturel" plutôt que de forcer "available" : si l'inspection n'a
 * pas encore eu lieu, retour à "pending" (le balayage normal ou une future
 * inspection décidera) ; si elle a eu lieu, le score décide.
 */
export async function releaseIncidentHold(incidentId: string) {
  const earnings = await prisma.workerEarning.findMany({ where: { heldForIncidentId: incidentId } });
  for (const earning of earnings) {
    const inspection = await prisma.taskInspection.findUnique({
      where: { taskId: earning.taskId },
      select: { score: true },
    });
    const status =
      inspection == null ? "pending" : inspection.score < PASSING_SCORE ? "disputed" : "available";
    await prisma.workerEarning.update({
      where: { id: earning.id },
      data: { status, heldForIncidentId: null },
    });
  }
}

/**
 * Ajustement manuel du gain d'une tâche — pénalité (no-show/retard/négligence
 * décidés par un humain, un score bas passe déjà par `resolveEarningOnInspection`)
 * ou prime manuelle libre (Q48-52). Volontairement PAS automatique pour le
 * no-show/retard : détecter ça tout seul demanderait un seuil (après combien
 * de temps c'est un abandon ?) qu'on n'a pas encore fixé — inventer un
 * chiffre qui retire de l'argent à un travailleur sans que Céphas l'ait
 * validé serait le genre d'erreur qu'on ne peut pas se permettre.
 * Bloqué une fois le gain retiré (Stripe déjà payé, plus rien à corriger ici).
 */
export async function applyEarningAdjustment(input: {
  taskId: string;
  kind: "penalite" | "prime";
  percent?: number;
  amount?: number;
  reason: string;
  /** Par défaut le réservateur (Task.assignedToId) — passer explicitement pour
   * ajuster le gain d'un coéquipier ayant reçu une part transférée (Lot 3c). */
  workerId?: string;
}) {
  let workerId = input.workerId;
  if (!workerId) {
    const task = await prisma.task.findUnique({ where: { id: input.taskId }, select: { assignedToId: true } });
    if (!task?.assignedToId) throw new Error("Cette tâche n'a pas de travailleur assigné.");
    workerId = task.assignedToId;
  }
  const earning = await prisma.workerEarning.findUnique({
    where: { taskId_workerId: { taskId: input.taskId, workerId } },
  });
  if (!earning) throw new Error("Aucun gain pour cette tâche.");
  if (earning.status === "withdrawn") {
    throw new Error("Ce gain a déjà été retiré — impossible de l'ajuster ici.");
  }
  const current = Number(earning.grossAmount);
  const magnitude = input.amount != null ? input.amount : round2(current * ((input.percent ?? 0) / 100));
  const signed = input.kind === "penalite" ? -magnitude : magnitude;
  const next = Math.max(0, round2(current + signed));

  await prisma.workerEarning.update({ where: { id: earning.id }, data: { grossAmount: next } });
  recordLedgerEntry({
    type: input.kind,
    amount: magnitude,
    partyAId: earning.workerId,
    partyAType: "user",
    taskId: input.taskId,
    reason: input.reason,
  });
  return { ...earning, grossAmount: next };
}

/**
 * Tente de facturer le sous-traitant au moment où un gain se libère — même
 * logique que le balayage 24h, factorisée pour être aussi utilisée par une
 * libération anticipée par inspection (voir resolveEarningOnInspection).
 * `failed: true` = carte refusée/Stripe en erreur → laisser "pending" pour
 * réessayer plus tard, ne JAMAIS libérer un gain jamais facturé.
 * `chargeId: null, failed: false` = Stripe non configuré pour cette
 * organisation (même philosophie no-op que le reste de l'app).
 */
async function attemptSubcontractorCharge(
  organization: { stripeCustomerId: string | null; stripePaymentMethodId: string | null },
  grossAmount: number,
): Promise<{ chargeId: string | null; failed: boolean }> {
  const stripe = env.STRIPE_SECRET_KEY ? getStripeClient() : null;
  if (!stripe || !organization.stripeCustomerId || !organization.stripePaymentMethodId) {
    return { chargeId: null, failed: false };
  }
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(grossAmount * 100),
      currency: "cad",
      customer: organization.stripeCustomerId,
      payment_method: organization.stripePaymentMethodId,
      off_session: true,
      confirm: true,
    });
    return { chargeId: paymentIntent.id, failed: false };
  } catch {
    return { chargeId: null, failed: true };
  }
}

/**
 * Recompute an earning's gross when the reported metric value is corrected
 * (by an inspector). No-op once the earning has been withdrawn.
 */
export async function reevaluateEarningForMetric(taskId: string, reportedValue: number | null) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      assignedToId: true,
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
  });
  if (!task?.assignedToId) return;
  const earning = await prisma.workerEarning.findUnique({
    where: { taskId_workerId: { taskId, workerId: task.assignedToId } },
  });
  if (!earning || earning.status === "withdrawn") return;

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

/**
 * Un score d'inspection ≥ seuil libère le gain immédiatement (sans attendre
 * les 24h) — la libération anticipée facture AUSSI le sous-traitant tout de
 * suite (bug corrigé : avant, ce chemin ne facturait jamais, seul le
 * balayage 24h le faisait ; une tâche libérée tôt échappait donc à la
 * charge). Un échec de carte laisse le gain "pending" pour le balayage
 * normal, exactement comme runDuePayouts.
 */
export async function resolveEarningOnInspection(taskId: string, score: number) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { assignedToId: true } });
  if (!task?.assignedToId) return;
  const earning = await prisma.workerEarning.findUnique({
    where: { taskId_workerId: { taskId, workerId: task.assignedToId } },
    include: { organization: true },
  });
  if (!earning || earning.status !== "pending") {
    return;
  }
  if (score < PASSING_SCORE) {
    await prisma.workerEarning.update({ where: { id: earning.id }, data: { status: "disputed" } });
    return;
  }

  // Bonus qualité automatique (Q48-52) — même seuil que le bonus de points
  // déjà en place, un petit % en plus sur le gain, pas juste des points.
  let grossAmount = Number(earning.grossAmount);
  if (score >= QUALITY_BONUS_SCORE) {
    const bonus = round2(grossAmount * (QUALITY_BONUS_PCT / 100));
    grossAmount = round2(grossAmount + bonus);
    recordLedgerEntry({
      type: "prime",
      amount: bonus,
      partyAId: earning.workerId,
      partyAType: "user",
      taskId,
      reason: `Bonus qualité automatique — score ${score}`,
    });
  }

  const { chargeId, failed } = await attemptSubcontractorCharge(earning.organization, grossAmount);
  if (failed) return; // reste "pending" — le balayage réessaiera

  await prisma.workerEarning.update({
    where: { id: earning.id },
    data: { status: "available", chargeId, grossAmount },
  });
  recordLedgerEntry({
    type: "gain_dispo",
    amount: grossAmount,
    partyAId: earning.workerId,
    partyAType: "user",
    taskId,
    reason: `Libéré par inspection — score ${score}`,
  });
  if (chargeId) {
    recordLedgerEntry({
      type: "charge_sous_traitant",
      amount: grossAmount,
      partyAId: earning.organizationId,
      partyAType: "organization",
      taskId,
      reason: `Stripe ${chargeId}`,
    });
  }
}

/**
 * Re-evaluate an earning when an inspection score is edited (unless already
 * paid out). Un gain suspendu pour incident (`heldForIncidentId`) reste
 * suspendu quel que soit le score — seul `releaseIncidentHold` le libère.
 */
export async function reevaluateEarningForScore(taskId: string, score: number | null) {
  const earning = await getPrimaryEarning(taskId);
  if (!earning || earning.status === "withdrawn") return;
  if (earning.heldForIncidentId) return;
  const status = score !== null && score < PASSING_SCORE ? "disputed" : "available";
  await prisma.workerEarning.update({ where: { id: earning.id }, data: { status } });
}

export async function runDuePayouts() {
  const due = await prisma.workerEarning.findMany({
    where: { status: "pending", availableAt: { lte: new Date() } },
    include: { organization: true },
  });

  let processed = 0;

  for (const earning of due) {
    const { chargeId, failed } = await attemptSubcontractorCharge(earning.organization, Number(earning.grossAmount));
    if (failed) continue; // leave pending for manual follow-up

    await prisma.workerEarning.update({
      where: { id: earning.id },
      data: { status: "available", chargeId },
    });
    void recordServerEvent("earning_paid", {
      userId: earning.workerId,
      role: "travailleur",
      props: { taskId: earning.taskId },
    }).catch(() => {});
    recordLedgerEntry({
      type: "gain_dispo",
      amount: Number(earning.grossAmount),
      partyAId: earning.workerId,
      partyAType: "user",
      taskId: earning.taskId,
      reason: "Balayage 24 h",
    });
    if (chargeId) {
      recordLedgerEntry({
        type: "charge_sous_traitant",
        amount: Number(earning.grossAmount),
        partyAId: earning.organizationId,
        partyAType: "organization",
        taskId: earning.taskId,
        reason: `Stripe ${chargeId}`,
      });
    }
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
