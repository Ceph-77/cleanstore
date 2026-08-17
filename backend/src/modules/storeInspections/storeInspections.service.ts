import { randomUUID } from "crypto";
import { prisma } from "../../db/prisma";
import { getSignedDownloadUrl, uploadFile } from "../../utils/storage";
import type { z } from "zod";
import type { storeInspectionCreateSchema } from "./storeInspections.schema";

type InspectionCreateInput = z.infer<typeof storeInspectionCreateSchema>;
type UploadedFile = { originalname: string; buffer: Buffer; mimetype: string };

export function listInspections(storeId: string) {
  return prisma.storeInspection.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { photos: true },
  });
}

export async function listInspectionsWithUrls(storeId: string) {
  const inspections = await listInspections(storeId);
  return Promise.all(
    inspections.map(async (inspection) => ({
      ...inspection,
      photos: await Promise.all(
        inspection.photos.map(async (photo) => ({
          ...photo,
          downloadUrl: await getSignedDownloadUrl(photo.fileKey),
        }))
      ),
    }))
  );
}

export async function createInspection(
  storeId: string,
  data: InspectionCreateInput,
  files: { before: UploadedFile[]; after: UploadedFile[] },
  createdById: string
) {
  const uploaded: { fileKey: string; fileName: string; photoType: "before" | "after" }[] = [];

  for (const file of files.before) {
    const fileKey = `stores/${storeId}/inspections/${randomUUID()}-${file.originalname}`;
    await uploadFile(fileKey, file.buffer, file.mimetype);
    uploaded.push({ fileKey, fileName: file.originalname, photoType: "before" });
  }
  for (const file of files.after) {
    const fileKey = `stores/${storeId}/inspections/${randomUUID()}-${file.originalname}`;
    await uploadFile(fileKey, file.buffer, file.mimetype);
    uploaded.push({ fileKey, fileName: file.originalname, photoType: "after" });
  }

  return prisma.storeInspection.create({
    data: {
      storeId,
      score: data.score,
      notes: data.notes,
      checklist: data.checklist,
      createdById,
      photos: { create: uploaded },
    },
    include: { photos: true },
  });
}
