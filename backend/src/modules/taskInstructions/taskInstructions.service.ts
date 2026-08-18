import { randomUUID } from "crypto";
import { prisma } from "../../db/prisma";
import { deleteFile, getSignedDownloadUrl, uploadFile } from "../../utils/storage";
import type { z } from "zod";
import type { RoleKey } from "@prisma/client";
import type { taskInstructionsUpdateSchema } from "./taskInstructions.schema";

type InstructionsUpdateInput = z.infer<typeof taskInstructionsUpdateSchema>;
type UploadedFile = { originalname: string; buffer: Buffer; mimetype: string };

async function getSubcontractorOrganizationId(userId: string) {
  const userRole = await prisma.userRole.findFirst({
    where: { userId, role: { key: "sous_traitant" } },
  });
  if (!userRole?.organizationId) {
    throw new Error("User is not linked to a sous-traitant organization");
  }
  return userRole.organizationId;
}

export async function assertCanEditTask(taskId: string, userId: string, roleKey: RoleKey) {
  if (roleKey === "admin") {
    return;
  }
  const organizationId = await getSubcontractorOrganizationId(userId);
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { store: { select: { assignedSubcontractorId: true } } },
  });
  if (!task || task.store.assignedSubcontractorId !== organizationId) {
    throw new Error("You are not allowed to edit this task");
  }
}

export function getInstructions(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: { expectedPhotos: true, steps: { orderBy: { order: "asc" } } },
  });
}

export async function getInstructionsWithUrls(taskId: string) {
  const task = await getInstructions(taskId);
  if (!task) {
    return null;
  }
  const expectedPhotos = await Promise.all(
    task.expectedPhotos.map(async (photo) => ({
      ...photo,
      downloadUrl: await getSignedDownloadUrl(photo.fileKey),
    }))
  );
  return { ...task, expectedPhotos };
}

export function updateInstructions(taskId: string, data: InstructionsUpdateInput) {
  return prisma.task.update({
    where: { id: taskId },
    data,
  });
}

export async function addExpectedPhotos(taskId: string, files: UploadedFile[]) {
  const uploaded: { fileKey: string; fileName: string }[] = [];
  for (const file of files) {
    const fileKey = `tasks/${taskId}/expected/${randomUUID()}-${file.originalname}`;
    await uploadFile(fileKey, file.buffer, file.mimetype);
    uploaded.push({ fileKey, fileName: file.originalname });
  }
  await prisma.taskExpectedPhoto.createMany({
    data: uploaded.map((photo) => ({ ...photo, taskId })),
  });
  return getInstructionsWithUrls(taskId);
}

export async function deleteExpectedPhoto(taskId: string, photoId: string) {
  const photo = await prisma.taskExpectedPhoto.findUnique({ where: { id: photoId } });
  if (!photo || photo.taskId !== taskId) {
    throw new Error("Photo not found for this task");
  }
  await deleteFile(photo.fileKey);
  await prisma.taskExpectedPhoto.delete({ where: { id: photoId } });
}

export async function addStep(taskId: string, text: string) {
  const last = await prisma.taskStep.findFirst({
    where: { taskId },
    orderBy: { order: "desc" },
  });
  return prisma.taskStep.create({
    data: { taskId, text, order: (last?.order ?? 0) + 1 },
  });
}

export async function updateStep(taskId: string, stepId: string, text: string) {
  const step = await prisma.taskStep.findUnique({ where: { id: stepId } });
  if (!step || step.taskId !== taskId) {
    throw new Error("Step not found for this task");
  }
  return prisma.taskStep.update({ where: { id: stepId }, data: { text } });
}

export async function deleteStep(taskId: string, stepId: string) {
  const step = await prisma.taskStep.findUnique({ where: { id: stepId } });
  if (!step || step.taskId !== taskId) {
    throw new Error("Step not found for this task");
  }
  await prisma.taskStep.delete({ where: { id: stepId } });
}

export async function listTasksForSubcontractor(userId: string) {
  const organizationId = await getSubcontractorOrganizationId(userId);
  return prisma.task.findMany({
    where: { store: { assignedSubcontractorId: organizationId } },
    include: {
      store: { select: { id: true, name: true, city: true } },
      _count: { select: { expectedPhotos: true, steps: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}
