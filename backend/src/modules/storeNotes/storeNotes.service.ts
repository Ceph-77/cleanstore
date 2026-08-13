import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { storeNoteCreateSchema } from "./storeNotes.schema";

type NoteCreateInput = z.infer<typeof storeNoteCreateSchema>;

export function listNotes(storeId: string) {
  return prisma.storeNote.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, fullName: true, email: true } } },
  });
}

export function createNote(storeId: string, data: NoteCreateInput, authorId: string) {
  return prisma.storeNote.create({
    data: { ...data, storeId, authorId },
    include: { author: { select: { id: true, fullName: true, email: true } } },
  });
}

export function deleteNote(id: string) {
  return prisma.storeNote.delete({ where: { id } });
}
