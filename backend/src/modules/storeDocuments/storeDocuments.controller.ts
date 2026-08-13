import type { Request, Response } from "express";
import * as storeDocumentsService from "./storeDocuments.service";

export async function list(req: Request, res: Response) {
  const documents = await storeDocumentsService.listDocumentsWithUrls(req.params.storeId);
  res.json({ documents });
}

export async function create(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }
  const document = await storeDocumentsService.createDocument(req.params.storeId, req.file, req.session.userId!);
  res.status(201).json({ document });
}

export async function remove(req: Request, res: Response) {
  await storeDocumentsService.deleteDocument(req.params.id);
  res.status(204).send();
}
