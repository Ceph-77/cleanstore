import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { storeContactCreateSchema, storeContactUpdateSchema } from "./storeContacts.schema";

type ContactCreateInput = z.infer<typeof storeContactCreateSchema>;
type ContactUpdateInput = z.infer<typeof storeContactUpdateSchema>;

export function listContacts(storeId: string) {
  return prisma.storeContact.findMany({
    where: { storeId },
    orderBy: { createdAt: "asc" },
  });
}

export function createContact(storeId: string, data: ContactCreateInput) {
  return prisma.storeContact.create({ data: { ...data, storeId } });
}

export function updateContact(id: string, data: ContactUpdateInput) {
  return prisma.storeContact.update({ where: { id }, data });
}

export function deleteContact(id: string) {
  return prisma.storeContact.delete({ where: { id } });
}
