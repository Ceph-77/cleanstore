import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Query params for a cursor-paginated list. `cursor` is the `id` of the last row
 * from the previous page (opaque to the client). Keyset pagination: stable when
 * rows are inserted between page loads, unlike offset.
 */
export const pageParamsSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PageParams = z.infer<typeof pageParamsSchema>;

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

type FindManyPageArgs = { take: number; cursor?: { id: string }; skip?: number };

/**
 * Prisma findMany args for one keyset page. Spread into a findMany that orders by
 * a *total* order ending in `id` (e.g. `orderBy: [{ createdAt: "desc" }, { id: "desc" }]`)
 * and does not set take/cursor/skip itself. Fetches limit+1 to detect a next page.
 */
export function pageArgs({ cursor, limit }: PageParams): FindManyPageArgs {
  return {
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };
}

/** Trims the limit+1 fetch to one page and derives the next cursor. */
export function toPage<T extends { id: string }>(rows: T[], limit: number): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1]!.id : null };
}
