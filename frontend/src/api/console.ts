import { apiClient } from "./client";
import type { ConsoleAlerts } from "../types";

export function getAlerts(): Promise<ConsoleAlerts> {
  return apiClient.get<ConsoleAlerts>("/console/alerts");
}
