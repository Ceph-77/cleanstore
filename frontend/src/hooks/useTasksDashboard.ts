import { useQuery } from "@tanstack/react-query";
import * as tasksDashboardApi from "../api/tasksDashboard";
import type { TaskStatus } from "../types";

export function useTasksDashboard(status?: TaskStatus) {
  return useQuery({
    queryKey: ["admin", "tasks-dashboard", status ?? "all"],
    queryFn: () => tasksDashboardApi.listDashboardTasks(status).then((r) => r.tasks),
    refetchInterval: 10000,
  });
}
