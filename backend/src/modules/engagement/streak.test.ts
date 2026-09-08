import { describe, expect, it } from "vitest";
import { streakFromDayKeys } from "./engagement.service";

// "now" fixed to 11:00 Toronto on 2026-06-15 -> today "2026-06-15", yesterday "2026-06-14".
const NOW = new Date("2026-06-15T15:00:00Z");
const streak = (days: string[]) => streakFromDayKeys(new Set(days), NOW);

describe("streakFromDayKeys", () => {
  it("is 0 with no completed days", () => {
    expect(streak([])).toBe(0);
  });

  it("is 1 when only today has a completed task", () => {
    expect(streak(["2026-06-15"])).toBe(1);
  });

  it("counts consecutive days back from today", () => {
    expect(streak(["2026-06-15", "2026-06-14", "2026-06-13"])).toBe(3);
  });

  it("stops at the first gap", () => {
    expect(streak(["2026-06-15", "2026-06-13", "2026-06-12"])).toBe(1);
  });

  it("still counts a streak that ends yesterday (today not yet worked)", () => {
    expect(streak(["2026-06-14", "2026-06-13"])).toBe(2);
  });

  it("is 0 once both today and yesterday are missing", () => {
    expect(streak(["2026-06-13", "2026-06-12"])).toBe(0);
  });

  it("ignores future-dated days", () => {
    expect(streak(["2026-06-16", "2026-06-15", "2026-06-14"])).toBe(2);
  });
});
