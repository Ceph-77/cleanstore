import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import * as api from "../api/ledger";
import { POLL_MS } from "../queryClient";

export function useLedger(filters: api.LedgerFilters) {
  return useInfiniteQuery({
    queryKey: ["ledger", filters],
    queryFn: ({ pageParam }) => api.listLedger(filters, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: POLL_MS,
  });
}

export function useLedgerSummary() {
  return useQuery({
    queryKey: ["ledger", "summary"],
    queryFn: api.getLedgerSummary,
    refetchInterval: POLL_MS,
  });
}
