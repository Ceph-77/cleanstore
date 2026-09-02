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

const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  acc: z.number().nonnegative().optional(),
  ts: z.number().optional(),
});

/**
 * Set (or clear, by passing nulls) a store's on-site geofence — the reference
 * point + radius a worker must be within to start a task there.
 */
export const storeGeofenceSchema = z.object({
  geofenceLat: z.number().min(-90).max(90).nullable(),
  geofenceLng: z.number().min(-180).max(180).nullable(),
  geofenceRadiusM: z.number().int().min(10).max(2000).nullable(),
  geofencePoints: z.array(geoPointSchema).max(10000).nullable().optional(),
});
