import { useInfiniteQuery } from "@tanstack/react-query";
import * as auditApi from "../api/audit";
import { POLL_MS } from "../queryClient";

export function useAudit(filters: auditApi.AuditFilters) {
  return useInfiniteQuery({
    queryKey: ["audit", filters],
    queryFn: ({ pageParam }) => auditApi.listAudit(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: POLL_MS,
  });
}
