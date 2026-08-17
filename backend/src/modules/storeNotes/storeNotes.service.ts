import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { storeNoteCreateSchema, storeNoteUpdateSchema } from "./storeNotes.schema";

type NoteCreateInput = z.infer<typeof storeNoteCreateSchema>;
type NoteUpdateInput = z.infer<typeof storeNoteUpdateSchema>;

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

export function updateNote(id: string, data: NoteUpdateInput) {
  return prisma.storeNote.update({
    where: { id },
    data,
    include: { author: { select: { id: true, fullName: true, email: true } } },
  });
}

export function deleteNote(id: string) {
  return prisma.storeNote.delete({ where: { id } });
}
