import { z } from "zod";

export const feedbackCreateSchema = z.object({
  selector: z.string().min(1),
  context: z.string().min(1),
  section: z.string().min(1),
  note: z.string().min(1),
  isMulti: z.boolean().optional().default(false),
});
