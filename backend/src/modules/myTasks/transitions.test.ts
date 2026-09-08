import { describe, expect, it } from "vitest";
import { isAllowedTransition } from "./myTasks.service";

describe("isAllowedTransition (worker-driven task status moves)", () => {
  it("allows claimed -> in_progress", () => {
    expect(isAllowedTransition("claimed", "in_progress")).toBe(true);
  });

  it("allows in_progress -> completed", () => {
    expect(isAllowedTransition("in_progress", "completed")).toBe(true);
  });

  it("forbids skipping in_progress", () => {
    expect(isAllowedTransition("claimed", "completed")).toBe(false);
  });

  it("forbids going backwards", () => {
    expect(isAllowedTransition("in_progress", "claimed")).toBe(false);
    expect(isAllowedTransition("completed", "in_progress")).toBe(false);
  });

  it("forbids moves out of a terminal / non-worker state", () => {
    expect(isAllowedTransition("completed", "inspected")).toBe(false);
    expect(isAllowedTransition("inspected", "completed")).toBe(false);
    expect(isAllowedTransition("cancelled", "open")).toBe(false);
  });

  it("does not let a worker claim an open task through this path", () => {
    expect(isAllowedTransition("open", "claimed")).toBe(false);
  });
});
