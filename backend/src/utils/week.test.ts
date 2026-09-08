import { describe, expect, it } from "vitest";
import {
  localDayKey,
  startOfCurrentDay,
  startOfCurrentMonth,
  startOfCurrentWeek,
  startOfLocalDay,
} from "./week";

// All results are absolute UTC instants and must not depend on the host's own
// timezone (the offset math was host-TZ-dependent before — this is the regression
// net). America/Toronto is EST (UTC-5) in winter, EDT (UTC-4) mid-March to early Nov.

describe("localDayKey", () => {
  it("returns the calendar day in the target zone", () => {
    expect(localDayKey(new Date("2026-01-15T12:00:00Z"))).toBe("2026-01-15");
  });

  it("rolls back across local midnight (late-evening UTC is still the previous day in Toronto)", () => {
    expect(localDayKey(new Date("2026-01-15T02:00:00Z"))).toBe("2026-01-14");
  });

  it("accounts for daylight time in summer", () => {
    // 03:30Z on Jul 15 is 23:30 Jul 14 in Toronto (EDT, UTC-4).
    expect(localDayKey(new Date("2026-07-15T03:30:00Z"))).toBe("2026-07-14");
  });
});

describe("startOfLocalDay", () => {
  it("resolves winter midnight to 05:00Z", () => {
    expect(startOfLocalDay("2026-01-12").toISOString()).toBe("2026-01-12T05:00:00.000Z");
  });

  it("resolves summer midnight to 04:00Z (DST)", () => {
    expect(startOfLocalDay("2026-07-12").toISOString()).toBe("2026-07-12T04:00:00.000Z");
  });

  it("handles the spring-forward day (still EST at local midnight)", () => {
    // 2026 DST starts 02:00 on Sun Mar 8; midnight that day is still UTC-5.
    expect(startOfLocalDay("2026-03-08").toISOString()).toBe("2026-03-08T05:00:00.000Z");
  });

  it("handles the fall-back day (still EDT at local midnight)", () => {
    // 2026 DST ends 02:00 on Sun Nov 1; midnight that day is still UTC-4.
    expect(startOfLocalDay("2026-11-01").toISOString()).toBe("2026-11-01T04:00:00.000Z");
  });
});

describe("startOfCurrentWeek", () => {
  it("anchors mid-week to the preceding Monday 00:00 local", () => {
    // Thu Jan 15 2026 -> Mon Jan 12 00:00 EST = 05:00Z
    expect(startOfCurrentWeek(new Date("2026-01-15T12:00:00Z")).toISOString()).toBe(
      "2026-01-12T05:00:00.000Z"
    );
  });

  it("maps Sunday back to the same week's Monday, not forward", () => {
    expect(startOfCurrentWeek(new Date("2026-01-18T18:00:00Z")).toISOString()).toBe(
      "2026-01-12T05:00:00.000Z"
    );
  });

  it("returns the same instant when called on the Monday itself", () => {
    expect(startOfCurrentWeek(new Date("2026-01-12T12:00:00Z")).toISOString()).toBe(
      "2026-01-12T05:00:00.000Z"
    );
  });

  it("uses the DST offset in summer", () => {
    expect(startOfCurrentWeek(new Date("2026-07-16T12:00:00Z")).getUTCHours()).toBe(4);
  });
});

describe("startOfCurrentMonth", () => {
  it("returns the 1st at local midnight", () => {
    expect(startOfCurrentMonth(new Date("2026-07-15T12:00:00Z")).toISOString()).toBe(
      "2026-07-01T04:00:00.000Z"
    );
  });

  it("keeps the month that is current *locally* when UTC has already rolled over", () => {
    // 02:00Z Feb 1 is still 21:00 Jan 31 in Toronto.
    expect(startOfCurrentMonth(new Date("2026-02-01T02:00:00Z")).toISOString()).toBe(
      "2026-01-01T05:00:00.000Z"
    );
  });
});

describe("startOfCurrentDay", () => {
  it("returns local midnight for the current local day (post-DST-switch March)", () => {
    expect(startOfCurrentDay(new Date("2026-03-10T12:00:00Z")).toISOString()).toBe(
      "2026-03-10T04:00:00.000Z"
    );
  });
});
