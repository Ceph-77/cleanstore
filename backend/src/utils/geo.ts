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
