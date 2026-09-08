import { useInfiniteQuery } from "@tanstack/react-query";
import * as tasksDashboardApi from "../api/tasksDashboard";
import { POLL_MS } from "../queryClient";
import type { TaskStatus } from "../types";

export function useTasksDashboard(status?: TaskStatus) {
  return useInfiniteQuery({
    queryKey: ["admin", "tasks-dashboard", status ?? "all"],
    queryFn: ({ pageParam }) => tasksDashboardApi.listDashboardTasks(status, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    refetchInterval: POLL_MS,
  });
}
