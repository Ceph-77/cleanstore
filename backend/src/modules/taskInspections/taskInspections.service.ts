import { randomUUID } from "crypto";
import { prisma } from "../../db/prisma";
import { getSignedDownloadUrl, uploadFile } from "../../utils/storage";
import { resolveEarningOnInspection, reevaluateEarningForScore } from "../payments/payments.service";
import * as engagement from "../engagement/engagement.service";
import type { z } from "zod";
import type { taskInspectionCreateSchema } from "./taskInspections.schema";

type InspectionCreateInput = z.infer<typeof taskInspectionCreateSchema>;
type UploadedFile = { originalname: string; buffer: Buffer; mimetype: string };

export function getInspectionForTask(taskId: string) {
  return prisma.taskInspection.findUnique({
    where: { taskId },
    include: { photos: true },
  });
}

export async function getInspectionWithUrls(taskId: string) {
  const inspection = await getInspectionForTask(taskId);
  if (!inspection) {
    return null;
  }
  const photos = await Promise.all(
    inspection.photos.map(async (photo) => ({
      ...photo,
      downloadUrl: await getSignedDownloadUrl(photo.fileKey),
    }))
  );
  return { ...inspection, photos };
}

export async function createInspection(
  taskId: string,
  data: InspectionCreateInput,
  files: { before: UploadedFile[]; after: UploadedFile[] },
  createdById: string
) {
  const existing = await prisma.taskInspection.findUnique({ where: { taskId } });
  if (existing) {
    throw new Error("This task has already been inspected");
  }

  const uploaded: { fileKey: string; fileName: string; photoType: "before" | "after" }[] = [];

  for (const file of files.before) {
    const fileKey = `tasks/${taskId}/inspections/${randomUUID()}-${file.originalname}`;
    await uploadFile(fileKey, file.buffer, file.mimetype);
    uploaded.push({ fileKey, fileName: file.originalname, photoType: "before" });
  }
  for (const file of files.after) {
    const fileKey = `tasks/${taskId}/inspections/${randomUUID()}-${file.originalname}`;
    await uploadFile(fileKey, file.buffer, file.mimetype);
    uploaded.push({ fileKey, fileName: file.originalname, photoType: "after" });
  }

  const inspection = await prisma.$transaction(async (tx) => {
    const created = await tx.taskInspection.create({
      data: {
        taskId,
        score: data.score,
        notes: data.notes,
        createdById,
        photos: { create: uploaded },
      },
      include: { photos: true },
    });
    await tx.task.update({ where: { id: taskId }, data: { status: "inspected" } });
    return created;
  });

  await resolveEarningOnInspection(taskId, data.score);

  void engagement.onTaskInspected(taskId, data.score).catch(() => {});

  return inspection;
}

/** Edit an existing task inspection's score/notes (admin correction). */
export async function updateInspection(taskId: string, patch: { score?: number; notes?: string | null }) {
  const existing = await prisma.taskInspection.findUnique({ where: { taskId } });
  if (!existing) throw new Error("Aucune inspection pour cette tâche.");

  const updated = await prisma.taskInspection.update({
    where: { taskId },
    data: {
      ...(patch.score !== undefined ? { score: patch.score } : {}),
      ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    },
    include: { photos: true },
  });

  if (patch.score !== undefined) {
    await reevaluateEarningForScore(taskId, patch.score);
    // keep the engagement quality bonus in sync with the corrected score
    await prisma.pointEntry.deleteMany({ where: { taskId, kind: "quality" } });
    if (patch.score >= 90) {
      const task = await prisma.task.findUnique({ where: { id: taskId }, select: { assignedToId: true } });
      if (task?.assignedToId) {
        await prisma.pointEntry.create({
          data: {
            workerId: task.assignedToId,
            kind: "quality",
            points: 15,
            taskId,
            createdAt: existing.createdAt,
          },
        });
      }
    }
  }

  return updated;
}
