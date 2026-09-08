import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { templateCreateSchema, templateUpdateSchema } from "./taskTemplates.schema";

type TemplateCreateInput = z.infer<typeof templateCreateSchema>;
type TemplateUpdateInput = z.infer<typeof templateUpdateSchema>;

const withSteps = { steps: { orderBy: { order: "asc" } } } satisfies Prisma.TaskTemplateInclude;

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

function scalarData<T extends { steps?: unknown }>(input: T): Omit<T, "steps"> {
  const { steps: _steps, ...rest } = input;
  return rest;
}

export async function createTemplate(input: TemplateCreateInput) {
  return prisma.taskTemplate.create({
    data: {
      ...scalarData(input),
      steps: input.steps
        ? { create: input.steps.map((text, i) => ({ order: i, text })) }
        : undefined,
    },
    include: withSteps,
  });
}

export async function updateTemplate(id: string, input: TemplateUpdateInput) {
  return prisma.$transaction(async (tx) => {
    await tx.taskTemplate.update({ where: { id }, data: scalarData(input) });
    if (input.steps !== undefined) {
      await tx.taskTemplateStep.deleteMany({ where: { templateId: id } });
      if (input.steps.length > 0) {
        await tx.taskTemplateStep.createMany({
          data: input.steps.map((text, i) => ({ templateId: id, order: i, text })),
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

/**
 * One-time copy of a template into a fresh Task on `storeId`. The task is
 * unpublished and `open` — the admin reviews price / metric target / any
 * store-specific wording, then publishes.
 */
export async function instantiateForStore(templateId: string, storeId: string, createdById: string) {
  const template = await prisma.taskTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: withSteps,
  });

  return prisma.task.create({
    data: {
      storeId,
      templateId: template.id,
      description: template.name,
      taskType: template.taskType,
      price: template.defaultPrice ?? 0,
      isNegotiable: template.isNegotiable,
      isRecurring: template.isRecurringDefault,
      isPublished: false,
      status: "open",
      expectedResultText: template.expectedResultText,
      howToText: template.howToText,
      requiredEquipment: template.requiredEquipment,
      estimatedDurationMinutes: template.estimatedDurationMinutes,
      metricLabel: template.metricLabel,
      metricUnit: template.metricUnit,
      metricTarget: template.defaultMetricTarget,
      createdById,
      steps: {
        create: template.steps.map((s) => ({ order: s.order, text: s.text })),
      },
    },
    include: { steps: { orderBy: { order: "asc" } } },
  });
}

export async function instantiateMany(templateIds: string[], storeId: string, createdById: string) {
  const created = [];
  for (const id of templateIds) {
    created.push(await instantiateForStore(id, storeId, createdById));
  }
  return created;
}
