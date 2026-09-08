import { describe, expect, it } from "vitest";
import { pageArgs, pageParamsSchema, toPage } from "./pagination";

describe("pageParamsSchema", () => {
  it("defaults the limit and leaves cursor undefined", () => {
    expect(pageParamsSchema.parse({})).toEqual({ limit: 20 });
  });

  it("coerces a string limit and keeps a uuid cursor", () => {
    const cursor = "11111111-1111-1111-1111-111111111111";
    expect(pageParamsSchema.parse({ limit: "5", cursor })).toEqual({ limit: 5, cursor });
  });

  it("rejects a limit over the max and a non-uuid cursor", () => {
    expect(pageParamsSchema.safeParse({ limit: 5000 }).success).toBe(false);
    expect(pageParamsSchema.safeParse({ cursor: "not-a-uuid" }).success).toBe(false);
  });
});

describe("pageArgs", () => {
  it("fetches limit+1 and no cursor on the first page", () => {
    expect(pageArgs({ limit: 20 })).toEqual({ take: 21 });
  });

  it("seeks past the cursor row on later pages", () => {
    const cursor = "22222222-2222-2222-2222-222222222222";
    expect(pageArgs({ limit: 20, cursor })).toEqual({
      take: 21,
      cursor: { id: cursor },
      skip: 1,
    });
  });
});

describe("toPage", () => {
  const rows = Array.from({ length: 21 }, (_, i) => ({ id: `id-${i}` }));

  it("returns a null cursor when the page is not full", () => {
    expect(toPage(rows.slice(0, 12), 20)).toEqual({
      items: rows.slice(0, 12),
      nextCursor: null,
    });
  });

  it("trims the extra row and points nextCursor at the last kept row", () => {
    const page = toPage(rows, 20);
    expect(page.items).toHaveLength(20);
    expect(page.items[19]!.id).toBe("id-19");
    expect(page.nextCursor).toBe("id-19");
  });

  it("handles an exactly-full fetch with no extra row", () => {
    expect(toPage(rows.slice(0, 20), 20).nextCursor).toBeNull();
  });
});
