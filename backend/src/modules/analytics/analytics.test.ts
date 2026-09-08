import { describe, expect, it } from "vitest";
import { computeFunnel, toCsv } from "./analytics.service";

const STEPS = ["viewed", "opened", "submitted"];

describe("computeFunnel", () => {
  it("is all zeros with no events", () => {
    expect(computeFunnel([], STEPS)).toEqual([
      { name: "viewed", count: 0, conversionFromFirstPct: 0, dropFromPrevPct: 0 },
      { name: "opened", count: 0, conversionFromFirstPct: 0, dropFromPrevPct: 0 },
      { name: "submitted", count: 0, conversionFromFirstPct: 0, dropFromPrevPct: 0 },
    ]);
  });

  it("counts an actor at a step only if it has every earlier step", () => {
    const events = [
      { key: "a", name: "viewed" },
      { key: "a", name: "opened" },
      { key: "a", name: "submitted" },
      { key: "b", name: "viewed" },
      { key: "b", name: "opened" },
      { key: "c", name: "viewed" },
      // d jumped straight to "submitted" with no "viewed"/"opened" — not counted anywhere
      { key: "d", name: "submitted" },
    ];
    const f = computeFunnel(events, STEPS);
    expect(f.map((r) => r.count)).toEqual([3, 2, 1]);
  });

  it("computes conversion vs first step and drop vs previous step", () => {
    const events = [
      ...["a", "b", "c", "d"].map((k) => ({ key: k, name: "viewed" })),
      ...["a", "b"].map((k) => ({ key: k, name: "opened" })),
      { key: "a", name: "submitted" },
    ];
    const f = computeFunnel(events, STEPS);
    expect(f[1]).toEqual({ name: "opened", count: 2, conversionFromFirstPct: 50, dropFromPrevPct: 50 });
    expect(f[2]).toEqual({ name: "submitted", count: 1, conversionFromFirstPct: 25, dropFromPrevPct: 50 });
  });

  it("ignores events outside the step list and null keys", () => {
    const events = [
      { key: "a", name: "viewed" },
      { key: "a", name: "noise" },
      { key: null, name: "viewed" },
    ];
    expect(computeFunnel(events, STEPS)[0]!.count).toBe(1);
  });

  it("dedupes repeated events for the same actor", () => {
    const events = [
      { key: "a", name: "viewed" },
      { key: "a", name: "viewed" },
      { key: "a", name: "viewed" },
    ];
    expect(computeFunnel(events, STEPS)[0]!.count).toBe(1);
  });
});

describe("toCsv", () => {
  it("returns an empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });

  it("writes a header row then one line per row", () => {
    const csv = toCsv([
      { name: "a", count: 1 },
      { name: "b", count: 2 },
    ]);
    expect(csv).toBe("name,count\na,1\nb,2");
  });

  it("quotes values containing comma, quote or newline", () => {
    const csv = toCsv([{ note: 'he said "hi", then left', ok: true }]);
    expect(csv).toBe('note,ok\n"he said ""hi"", then left",true');
  });

  it("serialises objects as JSON", () => {
    expect(toCsv([{ props: { taskId: "x" } }])).toBe('props\n"{""taskId"":""x""}"');
  });
});
