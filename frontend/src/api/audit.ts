import { apiClient } from "./client";
import { pageQuery, type Page } from "./pagination";
import type { AuditEntry } from "../types";

export interface AuditFilters {
  section?: string | null;
  action?: string | null;
  from?: string | null;
  to?: string | null;
}

export async function listAudit(
  filters: AuditFilters,
  cursor?: string | null,
): Promise<Page<AuditEntry>> {
  return apiClient.get<Page<AuditEntry>>(
    `/audit${pageQuery(cursor, {
      section: filters.section,
      action: filters.action,
      from: filters.from,
      to: filters.to,
    })}`,
  );
}
