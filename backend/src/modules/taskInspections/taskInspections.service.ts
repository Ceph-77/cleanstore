import { randomUUID } from "crypto";
import { prisma } from "../../db/prisma";
import { getSignedDownloadUrl, uploadFile } from "../../utils/storage";
import { resolveEarningOnInspection } from "../payments/payments.service";
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

  return inspection;
}
