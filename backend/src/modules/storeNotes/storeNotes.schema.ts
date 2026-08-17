import { z } from "zod";

export const storeNoteCreateSchema = z.object({
  content: z.string().min(1),
});

export const storeNoteUpdateSchema = storeNoteCreateSchema;
