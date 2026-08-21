import { prisma } from "../../db/prisma";
import { getStripeClient } from "../../utils/stripe";
import { env } from "../../config/env";

const EARNING_HOLD_MS = 24 * 60 * 60 * 1000;
const PASSING_SCORE = 50;

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

  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeCustomerId: customerId, stripePaymentMethodId: paymentMethodId },
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

  return prisma.workerEarning.create({
    data: {
      taskId,
      workerId: task.assignedToId,
      organizationId: task.store.assignedSubcontractorId,
      grossAmount: task.price,
      status: "pending",
      availableAt: new Date(Date.now() + EARNING_HOLD_MS),
    },
  });
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
