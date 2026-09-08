import { describe, expect, it } from "vitest";
import { haversineMeters } from "./geo";

describe("haversineMeters", () => {
  it("is zero for identical points", () => {
    expect(haversineMeters({ lat: 45, lng: -73 }, { lat: 45, lng: -73 })).toBe(0);
  });

  it("gives ~111.2 km per degree of latitude", () => {
    const d = haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });

  it("shrinks a degree of longitude by cos(latitude)", () => {
    // ~0.001 deg lng at lat 45 ≈ 111195 * 0.001 * cos(45°) ≈ 78.6 m
    const d = haversineMeters({ lat: 45, lng: -73 }, { lat: 45, lng: -73.001 });
    expect(d).toBeGreaterThan(75);
    expect(d).toBeLessThan(82);
  });

  it("is symmetric", () => {
    const a = { lat: 46.81, lng: -71.21 };
    const b = { lat: 45.5, lng: -73.57 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });
});
