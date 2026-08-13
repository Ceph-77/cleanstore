import { z } from "zod";

export const storeCreateSchema = z.object({
  name: z.string().min(1),
  banner: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  storeManagerName: z.string().optional(),
  storeManagerPhone: z.string().optional(),
  storeManagerEmail: z.string().email().optional().or(z.literal("")),
  squareFootage: z.coerce.number().optional(),
  surfaceType: z.string().optional(),
  zones: z.array(z.string()).optional(),
  cleaningFrequency: z.string().optional(),
  cleaningSchedule: z.string().optional(),
  contractStartDate: z.coerce.date().optional(),
  contractEndDate: z.coerce.date().optional(),
  contractRate: z.coerce.number().optional(),
  securityAccessInfo: z.string().optional(),
  storeHours: z.string().optional(),
  specialRequirements: z.string().optional(),
  grandeCompagnieId: z.string().uuid().optional(),
  assignedSubcontractorId: z.string().uuid().optional(),
  assignedWorkerId: z.string().uuid().optional(),
});

export const storeUpdateSchema = storeCreateSchema.partial();
