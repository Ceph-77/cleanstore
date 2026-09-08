-- Indexes for hot-path filters that were doing sequential scans. Postgres does
-- not index foreign-key columns automatically. All additive; the tables are
-- small so CREATE INDEX takes a brief lock only.

-- Task: worker's own task list (myTasks), plus inspection/leaderboard joins,
-- filter on assigned_to.
CREATE INDEX "tasks_assigned_to_idx" ON "tasks"("assigned_to");

-- Task: the marketplace list filters status = 'open' AND is_published = true and
-- is polled every 10s. The composite supersedes the status-only index (queries
-- filtering status alone still use it as a prefix).
DROP INDEX "tasks_status_idx";
CREATE INDEX "tasks_status_is_published_idx" ON "tasks"("status", "is_published");

-- Store: "available stores" (assigned_subcontractor_id IS NULL) is polled by
-- every subcontractor; the subcontractor task list filters on it too.
CREATE INDEX "stores_assigned_subcontractor_id_idx" ON "stores"("assigned_subcontractor_id");

-- TaskClaim: "my claims", the claim-decision notification poll, and the
-- per-store weekly claim-count all filter on worker_id.
CREATE INDEX "task_claims_worker_id_created_at_idx" ON "task_claims"("worker_id", "created_at");
