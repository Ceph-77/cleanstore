import { z } from "zod";

export const myTaskStatusUpdateSchema = z.object({
  status: z.enum(["in_progress", "completed"]),
  note: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().nonnegative().optional(),
  // Required on completion when the task carries a performance target.
  reportedMetricValue: z.coerce.number().nonnegative().optional(),
  // Required on completion when the task is paid per unit.
  reportedUnits: z.coerce.number().nonnegative().optional(),
  // Odometer reading — required on start / completion when the task uses one.
  startOdometer: z.coerce.number().nonnegative().optional(),
  endOdometer: z.coerce.number().nonnegative().optional(),
});

export const myTaskStepToggleSchema = z.object({
  isDone: z.boolean(),
});
