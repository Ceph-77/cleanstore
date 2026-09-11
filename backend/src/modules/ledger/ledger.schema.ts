import { z } from "zod";
import { pageParamsSchema } from "../../utils/pagination";

export const ledgerListQuerySchema = pageParamsSchema.extend({
  type: z.string().max(40).optional(),
  partyAId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
