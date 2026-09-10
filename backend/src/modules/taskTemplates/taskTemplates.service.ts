import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { templateCreateSchema, templateUpdateSchema } from "./taskTemplates.schema";

type TemplateCreateInput = z.infer<typeof templateCreateSchema>;
type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;

const withSteps = {
  steps: { orderBy: { order: "asc" } },
  variants: { orderBy: { order: "asc" } },
} satisfies Prisma.TaskTemplateInclude;

export function listTemplates(includeInactive = false) {
  return prisma.taskTemplate.findMany({
    where: includeInactive ? undefined : { isActive: true },
    include: withSteps,
    orderBy: { name: "asc" },
  });
}

export function getTemplate(id: string) {
  return prisma.taskTemplate.findUnique({ where: { id }, include: withSteps });
}

type VariantInput = {
  name: string;
  price?: number | null;
  metricTarget?: number | null;
  durationMinutes?: number | null;
};

const variantCreateData = (variants: VariantInput[] | undefined) =>
  (variants ?? []).map((v, i) => ({
    name: v.name,
    price: v.price ?? null,
    metricTarget: v.metricTarget ?? null,
    durationMinutes: v.durationMinutes ?? null,
    order: i,
  }));

/** Prisma exige `Prisma.JsonNull` (jamais `null`) pour vider un champ Json?. */
function jsonField(v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (v === undefined) return undefined;
  if (v === null) return Prisma.JsonNull;
  return v as Prisma.InputJsonValue;
}

/** Sépare `steps`, `recurrence`, `variants` (traités à part) du reste des scalaires. */
function scalarData<T extends { steps?: unknown; recurrence?: unknown; variants?: unknown }>(
  input: T,
) {
  const { steps: _steps, variants: _variants, recurrence, ...rest } = input;
  return { rest, recurrence };
}

export async function createTemplate(input: TemplateCreateInput) {
  const { rest, recurrence } = scalarData(input);
  return prisma.taskTemplate.create({
    data: {
      ...rest,
      ...(recurrence !== undefined ? { recurrence: jsonField(recurrence) } : {}),
      steps: input.steps
        ? { create: input.steps.map((text, i) => ({ order: i, text })) }
        : undefined,
      variants: input.variants ? { create: variantCreateData(input.variants) } : undefined,
    },
    include: withSteps,
  });
}

export async function updateTemplate(id: string, input: TemplateUpdateInput) {
  const { rest, recurrence } = scalarData(input);
  return prisma.$transaction(async (tx) => {
    await tx.taskTemplate.update({
      where: { id },
      data: { ...rest, ...(recurrence !== undefined ? { recurrence: jsonField(recurrence) } : {}) },
    });
    if (input.steps !== undefined) {
      await tx.taskTemplateStep.deleteMany({ where: { templateId: id } });
      if (input.steps.length > 0) {
        await tx.taskTemplateStep.createMany({
          data: input.steps.map((text, i) => ({ templateId: id, order: i, text })),
        });
      }
    }
    if (input.variants !== undefined) {
      await tx.taskTemplateVariant.deleteMany({ where: { templateId: id } });
      if (input.variants.length > 0) {
        await tx.taskTemplateVariant.createMany({
          data: variantCreateData(input.variants).map((v) => ({ ...v, templateId: id })),
        });
      }
    }
    return tx.taskTemplate.findUniqueOrThrow({ where: { id }, include: withSteps });
  });
}

/** Soft-delete: keeps templateId links on already-created tasks intact. */
export function deactivateTemplate(id: string) {
  return prisma.taskTemplate.update({ where: { id }, data: { isActive: false } });
}

/** Copie un modèle (nom suffixé « (copie) », inactif — l'admin l'active après relecture). */
export async function duplicateTemplate(id: string) {
  const src = await prisma.taskTemplate.findUniqueOrThrow({ where: { id }, include: withSteps });
  const {
    id: _id,
    createdAt: _c,
    updatedAt: _u,
    steps,
    variants,
    name,
    recurrence,
    ...scalars
  } = src;

  let candidate = `${name} (copie)`;
  for (let i = 2; await prisma.taskTemplate.findUnique({ where: { name: candidate } }); i++) {
    candidate = `${name} (copie ${i})`;
  }

  return prisma.taskTemplate.create({
    data: {
      ...scalars,
      name: candidate,
      isActive: false,
      recurrence: jsonField(recurrence),
      steps: { create: steps.map((s) => ({ order: s.order, text: s.text })) },
      variants: {
        create: variants.map((v) => ({
          name: v.name,
          price: v.price,
          metricTarget: v.metricTarget,
          durationMinutes: v.durationMinutes,
          order: v.order,
        })),
      },
    },
    include: withSteps,
  });
}

/**
 * One-time copy of a template into a fresh Task on `storeId`. The task is
 * unpublished and `open` — the admin reviews price / metric target / any
 * store-specific wording, then publishes.
 */
export async function instantiateForStore(
  templateId: string,
  storeId: string,
  createdById: string,
  variantId?: string,
) {
  const template = await prisma.taskTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: withSteps,
  });
  const variant = variantId ? template.variants.find((v) => v.id === variantId) : undefined;

  return prisma.task.create({
    data: {
      storeId,
      templateId: template.id,
      description: variant ? `${template.name} — ${variant.name}` : template.name,
      variantName: variant?.name ?? null,
      taskType: template.taskType,
      price: (variant?.price ?? template.defaultPrice) ?? 0,
      isNegotiable: template.isNegotiable,
      isRecurring: template.isRecurringDefault,
      isPublished: false,
      status: "open",
      expectedResultText: template.expectedResultText,
      howToText: template.howToText,
      requiredEquipment: template.requiredEquipment,
      estimatedDurationMinutes: variant?.durationMinutes ?? template.estimatedDurationMinutes,
      metricLabel: template.metricLabel,
      metricUnit: template.metricUnit,
      metricTarget: variant?.metricTarget ?? template.defaultMetricTarget,
      paymentMode: template.paymentMode,
      hourlyRate: template.hourlyRate,
      hourlyCapMinutes: template.hourlyCapMinutes,
      unitPrice: template.unitPrice,
      unitLabel: template.unitLabel,
      requiresOdometer: template.requiresOdometer,
      category: template.category,
      timeWindowStart: template.timeWindowStart,
      timeWindowEnd: template.timeWindowEnd,
      requiresStartPhoto: template.requiresStartPhoto,
      requiresEndPhoto: template.requiresEndPhoto,
      recurrence: jsonField(template.recurrence),
      createdById,
      steps: {
        create: template.steps.map((s) => ({ order: s.order, text: s.text })),
      },
    },
    include: { steps: { orderBy: { order: "asc" } } },
  });
}

export async function instantiateMany(
  templateIds: string[],
  storeId: string,
  createdById: string,
  variantByTemplate?: Record<string, string>,
) {
  const created = [];
  for (const id of templateIds) {
    created.push(await instantiateForStore(id, storeId, createdById, variantByTemplate?.[id]));
  }
  return created;
}
