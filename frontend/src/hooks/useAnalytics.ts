import { useQuery } from "@tanstack/react-query";
import * as analyticsApi from "../api/analytics";

export function useAnalyticsOverview(days: number) {
  return useQuery({
    queryKey: ["admin", "analytics", "overview", days],
    queryFn: () => analyticsApi.getOverview(days),
  });
}

export function useRecentEvents(days: number) {
  return useQuery({
    queryKey: ["admin", "analytics", "recent", days],
    queryFn: () => analyticsApi.getRecent(days).then((r) => r.events),
  });
}
