import { describe, expect, it } from "vitest";
import { POINTS } from "./points";

describe("POINTS.fasterBonus", () => {
  it("is +10 at the floor (nothing saved)", () => {
    expect(POINTS.fasterBonus(0)).toBe(10);
    expect(POINTS.fasterBonus(4)).toBe(10); // < 5 min saved rounds down to 0
  });

  it("adds +1 per full 5 minutes saved", () => {
    expect(POINTS.fasterBonus(5)).toBe(11);
    expect(POINTS.fasterBonus(24)).toBe(14);
    expect(POINTS.fasterBonus(25)).toBe(15);
  });

  it("caps at +30", () => {
    expect(POINTS.fasterBonus(100)).toBe(30);
    expect(POINTS.fasterBonus(10_000)).toBe(30);
  });

  it("never goes below +10 for a negative (slower than estimate)", () => {
    expect(POINTS.fasterBonus(-50)).toBe(10);
  });
});

describe("POINTS.streakBonus", () => {
  it("equals the day count below the cap", () => {
    expect(POINTS.streakBonus(0)).toBe(0);
    expect(POINTS.streakBonus(3)).toBe(3);
    expect(POINTS.streakBonus(30)).toBe(30);
  });

  it("caps at 30", () => {
    expect(POINTS.streakBonus(31)).toBe(30);
    expect(POINTS.streakBonus(100)).toBe(30);
  });
});

describe("POINTS milestone tables", () => {
  it("keeps the documented streak milestones", () => {
    expect([...POINTS.STREAK_MILESTONES]).toEqual([3, 5, 7, 14, 30, 60, 100]);
  });

  it("keeps the documented task-count milestone bonuses", () => {
    expect(POINTS.TASK_MILESTONES[1]).toBe(25);
    expect(POINTS.TASK_MILESTONES[10]).toBe(50);
    expect(POINTS.TASK_MILESTONES[250]).toBe(500);
  });
});
