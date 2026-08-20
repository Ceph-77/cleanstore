import { z } from "zod";

export const taskStatusEnum = z.enum(["open", "claimed", "completed", "inspected", "cancelled"]);

export const taskCreateSchema = z.object({
  description: z.string().min(1),
  taskType: z.string().optional(),
  price: z.coerce.number().nonnegative(),
  isNegotiable: z.boolean().optional(),
  dueDate: z.coerce.date().optional(),
  status: taskStatusEnum.optional(),
  assignedToId: z.string().uuid().optional(),
  isRecurring: z.boolean().optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();
