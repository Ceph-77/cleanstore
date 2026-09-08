import { QueryClient } from "@tanstack/react-query";

/**
 * Shared polling cadence for the handful of queries that must stay fresh without
 * a manual refresh (marketplace lists, claim decisions, wallet balance…).
 * Was 10s in several hooks — every open tab hit the free-tier backend ~30×/min.
 */
export const POLL_MS = 30_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays "fresh" for 30s: navigating away and back within that window
      // reuses the cache instead of refetching.
      staleTime: 30_000,
      // Queries that need live data set their own refetchInterval; refetching on
      // every window focus on top of that just hammered the backend.
      refetchOnWindowFocus: false,
    },
  },
});
