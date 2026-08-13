import { prisma } from "../../db/prisma";
import type { z } from "zod";
import type { storeInvoiceCreateSchema, storeInvoiceUpdateSchema } from "./storeInvoices.schema";

type InvoiceCreateInput = z.infer<typeof storeInvoiceCreateSchema>;
type InvoiceUpdateInput = z.infer<typeof storeInvoiceUpdateSchema>;

export function listInvoices(storeId: string) {
  return prisma.storeInvoice.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
}

export function createInvoice(storeId: string, data: InvoiceCreateInput, createdById: string) {
  return prisma.storeInvoice.create({ data: { ...data, storeId, createdById } });
}

export function updateInvoice(id: string, data: InvoiceUpdateInput) {
  return prisma.storeInvoice.update({ where: { id }, data });
}

export function deleteInvoice(id: string) {
  return prisma.storeInvoice.delete({ where: { id } });
}
