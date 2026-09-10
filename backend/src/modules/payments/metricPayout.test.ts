import { describe, expect, it } from "vitest";
import { metricPayoutRatio, scaleEarning, computeGrossAmount } from "./payments.service";

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

describe("computeGrossAmount", () => {
  it("fixed : paie le prix, arrondi au cent", () => {
    expect(computeGrossAmount({ paymentMode: "fixed", price: 52 })).toBe(52);
    expect(computeGrossAmount({ paymentMode: "fixed", price: 52.005 })).toBe(52.01);
  });

  it("metric_prorata : prix × ratio (comportement historique)", () => {
    expect(
      computeGrossAmount({
        paymentMode: "metric_prorata",
        price: 45,
        metricTarget: 1.6,
        reportedMetricValue: 0.8,
      }),
    ).toBe(22.5);
    expect(
      computeGrossAmount({ paymentMode: "metric_prorata", price: 45, metricTarget: 1.6, reportedMetricValue: null }),
    ).toBe(0);
  });

  it("hourly : taux × minutes / 60, plafonné", () => {
    expect(computeGrossAmount({ paymentMode: "hourly", price: 0, hourlyRate: 30, workedMinutes: 90 })).toBe(45);
    expect(
      computeGrossAmount({ paymentMode: "hourly", price: 0, hourlyRate: 30, workedMinutes: 300, hourlyCapMinutes: 120 }),
    ).toBe(60);
  });

  it("hourly : 0 si aucune minute ; retombe sur le prix si aucun taux", () => {
    expect(computeGrossAmount({ paymentMode: "hourly", price: 40, hourlyRate: 30, workedMinutes: 0 })).toBe(0);
    expect(computeGrossAmount({ paymentMode: "hourly", price: 40, hourlyRate: null, workedMinutes: 90 })).toBe(40);
  });

  it("per_unit : prix unitaire × nombre réalisé", () => {
    expect(computeGrossAmount({ paymentMode: "per_unit", price: 0, unitPrice: 2.5, reportedUnits: 12 })).toBe(30);
    expect(computeGrossAmount({ paymentMode: "per_unit", price: 0, unitPrice: 2.5, reportedUnits: null })).toBe(0);
  });

  it("urgence : +25 % sur le brut, quel que soit le mode", () => {
    expect(computeGrossAmount({ paymentMode: "fixed", price: 52, latePremiumApplied: true })).toBe(65);
    expect(
      computeGrossAmount({
        paymentMode: "metric_prorata",
        price: 40,
        metricTarget: 2,
        reportedMetricValue: 1,
        latePremiumApplied: true,
      }),
    ).toBe(25); // 40×0.5 = 20 → ×1.25
    expect(computeGrossAmount({ paymentMode: "fixed", price: 52, latePremiumApplied: false })).toBe(52);
  });
});
