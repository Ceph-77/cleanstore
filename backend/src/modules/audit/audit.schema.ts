import { z } from "zod";
import { pageParamsSchema } from "../../utils/pagination";

export const auditListQuerySchema = pageParamsSchema.extend({
  section: z.string().max(40).optional(),
  action: z.string().max(40).optional(),
  actorId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type AuditListQuery = z.infer<typeof auditListQuerySchema>;
