import { z } from "zod";

export const taskInstructionsUpdateSchema = z.object({
  expectedResultText: z.string().optional(),
  howToText: z.string().optional(),
  requiredEquipment: z.array(z.string()).optional(),
  estimatedDurationMinutes: z.coerce.number().int().positive().optional(),
});

export const taskStepCreateSchema = z.object({
  text: z.string().min(1),
});

export const taskStepUpdateSchema = z.object({
  text: z.string().min(1),
});
