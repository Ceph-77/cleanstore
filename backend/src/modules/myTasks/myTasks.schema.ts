import { z } from "zod";

export const myTaskStatusUpdateSchema = z.object({
  status: z.enum(["in_progress", "completed"]),
  note: z.string().optional(),
});
