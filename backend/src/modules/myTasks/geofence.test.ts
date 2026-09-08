import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { evaluateStartLocation, type GeofenceStore } from "./myTasks.service";

const D = (n: number) => new Prisma.Decimal(n);

const withGeofencePoint: GeofenceStore = {
  geofenceLat: D(45.5),
  geofenceLng: D(-73.5),
  geofenceRadiusM: 50,
  latitude: D(45.5),
  longitude: D(-73.5),
};

const onlyGeocoded: GeofenceStore = {
  geofenceLat: null,
  geofenceLng: null,
  geofenceRadiusM: null,
  latitude: D(45.5),
  longitude: D(-73.5),
};

const noCoords: GeofenceStore = {
  geofenceLat: null,
  geofenceLng: null,
  geofenceRadiusM: null,
  latitude: null,
  longitude: null,
};

describe("evaluateStartLocation", () => {
  it("notes when the store has no location on file", () => {
    expect(evaluateStartLocation(noCoords, { lat: 45.5, lng: -73.5 })).toBe(
      "Aucun emplacement GPS enregistré pour ce magasin."
    );
  });

  it("notes when the worker sent no position", () => {
    expect(evaluateStartLocation(withGeofencePoint, undefined)).toBe(
      "Position non fournie au démarrage."
    );
  });

  it("notes when the position has non-finite coordinates", () => {
    expect(evaluateStartLocation(withGeofencePoint, { lat: Number.NaN, lng: -73.5 })).toBe(
      "Position non fournie au démarrage."
    );
  });

  it("returns null (no note) when inside the geofence radius", () => {
    expect(evaluateStartLocation(withGeofencePoint, { lat: 45.5, lng: -73.5 })).toBeNull();
    // ~11 m north, still within the 50 m radius
    expect(evaluateStartLocation(withGeofencePoint, { lat: 45.5001, lng: -73.5 })).toBeNull();
  });

  it("returns a distance note when clearly outside the radius", () => {
    const note = evaluateStartLocation(withGeofencePoint, { lat: 45.51, lng: -73.5 });
    expect(note).toMatch(/^Démarrage à ~\d+ m du magasin \(repère 50 m\)\.$/);
  });

  it("lets GPS accuracy absorb a borderline miss", () => {
    expect(
      evaluateStartLocation(withGeofencePoint, { lat: 45.51, lng: -73.5, accuracy: 3000 })
    ).toBeNull();
  });

  it("falls back to the geocoded point with the wider 200 m radius", () => {
    // ~167 m away: outside 100 m, inside the 200 m fallback
    expect(evaluateStartLocation(onlyGeocoded, { lat: 45.5015, lng: -73.5 })).toBeNull();
    const note = evaluateStartLocation(onlyGeocoded, { lat: 45.505, lng: -73.5 });
    expect(note).toMatch(/\(repère 200 m\)\.$/);
  });
});
