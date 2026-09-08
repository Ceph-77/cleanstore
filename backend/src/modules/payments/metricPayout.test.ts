import { describe, expect, it } from "vitest";
import { metricPayoutRatio, scaleEarning } from "./payments.service";

describe("metricPayoutRatio", () => {
  it("is 1 when there is no target (flat price)", () => {
    expect(metricPayoutRatio(null, null)).toBe(1);
    expect(metricPayoutRatio(0, 5)).toBe(1);
    expect(metricPayoutRatio(undefined, 5)).toBe(1);
  });

  it("is linear below the target", () => {
    expect(metricPayoutRatio(1.6, 0.8)).toBeCloseTo(0.5, 10);
    expect(metricPayoutRatio(2, 1.5)).toBeCloseTo(0.75, 10);
  });

  it("caps at 1 when the target is met or exceeded", () => {
    expect(metricPayoutRatio(1.6, 1.6)).toBe(1);
    expect(metricPayoutRatio(1.6, 3.2)).toBe(1);
  });

  it("pays nothing when there is a target but no reported value", () => {
    expect(metricPayoutRatio(1.6, null)).toBe(0);
    expect(metricPayoutRatio(1.6, undefined)).toBe(0);
    expect(metricPayoutRatio(1.6, -1)).toBe(0);
  });

  it("is 0 at zero distance", () => {
    expect(metricPayoutRatio(1.6, 0)).toBe(0);
  });
});

describe("scaleEarning", () => {
  it("rounds to the cent", () => {
    expect(scaleEarning(100, 0.5)).toBe(50);
    expect(scaleEarning(99.99, 1)).toBe(99.99);
    expect(scaleEarning(100, 1 / 3)).toBe(33.33);
    expect(scaleEarning(45, 0.8125)).toBe(36.56); // 36.5625 -> 36.56
  });

  it("full price at ratio 1, zero at ratio 0", () => {
    expect(scaleEarning(80, 1)).toBe(80);
    expect(scaleEarning(80, 0)).toBe(0);
  });
});
