import { z } from "zod";

export const myTaskStatusUpdateSchema = z.object({
  status: z.enum(["in_progress", "completed"]),
  note: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().nonnegative().optional(),
});

export const myTaskStepToggleSchema = z.object({
  isDone: z.boolean(),
});
