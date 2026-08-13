import { z } from "zod";

export const invoiceStatusEnum = z.enum(["unpaid", "paid", "overdue"]);

export const storeInvoiceCreateSchema = z.object({
  label: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  status: invoiceStatusEnum.optional(),
  issuedDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  paidDate: z.coerce.date().optional(),
});

export const storeInvoiceUpdateSchema = storeInvoiceCreateSchema.partial();
