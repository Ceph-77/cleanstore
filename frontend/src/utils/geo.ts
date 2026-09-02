import type { GeoPoint } from "../types";

/** Radius used when a store has a walked, on-site geofence point. */
export const DEFAULT_START_RADIUS_M = 100;
/** Wider radius used when we only have the address-geocoded coordinates. */
export const FALLBACK_START_RADIUS_M = 200;

export interface LatLng {
  lat: number;
  lng: number;
}

/** Great-circle distance between two points, in metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function centroid(points: LatLng[]): LatLng {
  const n = points.length || 1;
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / n,
    lng: points.reduce((s, p) => s + p.lng, 0) / n,
  };
}

/**
 * Effective radius for a set of walked points: the farthest point from the
 * centroid, padded by the mean GPS accuracy, floored at DEFAULT_START_RADIUS_M.
 */
export function effectiveRadiusM(points: GeoPoint[]): number {
  if (points.length === 0) return DEFAULT_START_RADIUS_M;
  const c = centroid(points);
  const maxDist = Math.max(...points.map((p) => haversineMeters(c, p)));
  const accs = points.map((p) => p.acc).filter((a): a is number => typeof a === "number");
  const meanAcc = accs.length ? accs.reduce((s, a) => s + a, 0) / accs.length : 0;
  return Math.max(DEFAULT_START_RADIUS_M, Math.round(maxDist + meanAcc));
}

export interface FixedPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

/** One-shot high-accuracy geolocation with friendly French error messages. */
export function getCurrentPosition(): Promise<FixedPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("La géolocalisation n'est pas disponible sur cet appareil."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Autorisez la localisation pour démarrer la tâche."));
        } else if (err.code === err.TIMEOUT) {
          reject(new Error("Impossible d'obtenir votre position (délai dépassé). Réessayez à l'extérieur."));
        } else {
          reject(new Error("Impossible d'obtenir votre position. Vérifiez le GPS et réessayez."));
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
}
