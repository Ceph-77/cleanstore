/** One keyset page. `nextCursor` is null when there are no more rows. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Builds the query string for a cursor-paginated GET. The server defaults the
 * page size, so the client only ever sends the cursor (+ any list filters).
 */
export function pageQuery(
  cursor: string | null | undefined,
  extra?: Record<string, string | null | undefined>
): string {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value != null && value !== "") params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
