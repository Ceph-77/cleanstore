import { randomUUID } from "crypto";
import { prisma } from "../../db/prisma";
import { deleteFile, getSignedDownloadUrl, uploadFile } from "../../utils/storage";

export function listDocuments(storeId: string) {
  return prisma.storeDocument.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
}

export async function listDocumentsWithUrls(storeId: string) {
  const documents = await listDocuments(storeId);
  return Promise.all(
    documents.map(async (doc) => ({
      ...doc,
      downloadUrl: await getSignedDownloadUrl(doc.fileKey),
    }))
  );
}

export async function createDocument(
  storeId: string,
  file: { originalname: string; buffer: Buffer; mimetype: string; size: number },
  uploadedById: string
) {
  const fileKey = `stores/${storeId}/${randomUUID()}-${file.originalname}`;
  await uploadFile(fileKey, file.buffer, file.mimetype);

  return prisma.storeDocument.create({
    data: {
      storeId,
      fileName: file.originalname,
      fileKey,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedById,
    },
  });
}

export async function deleteDocument(id: string) {
  const doc = await prisma.storeDocument.findUniqueOrThrow({ where: { id } });
  await deleteFile(doc.fileKey);
  await prisma.storeDocument.delete({ where: { id } });
}
