import { useEffect, useRef, useState } from "react";
import { Button } from "../common/Button";
import { IconMapPin } from "../common/icons";
import { useSetStoreGeofence } from "../../hooks/useStores";
import {
  centroid,
  effectiveRadiusM,
  getCurrentPosition,
  DEFAULT_START_RADIUS_M,
  FALLBACK_START_RADIUS_M,
} from "../../utils/geo";
import type { GeoPoint, Store } from "../../types";

export function StoreGeofenceCard({ store }: { store: Store }) {
  const setGeofence = useSetStoreGeofence(store.id);
  const watchIdRef = useRef<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [points, setPoints] = useState<GeoPoint[]>([]);
  const [manualRadius, setManualRadius] = useState<string>(
    store.geofenceRadiusM ? String(store.geofenceRadiusM) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const hasOnSite = store.geofenceLat != null && store.geofenceLng != null;
  const hasGeocoded = store.latitude != null && store.longitude != null;

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  function startRecording() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setPoints([]);
    setRecording(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) =>
        setPoints((prev) => [
          ...prev,
          {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: pos.coords.accuracy,
            ts: pos.timestamp,
          },
        ]),
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "Autorisez la localisation pour faire le relevé."
            : "Impossible de suivre la position. Réessayez à l'extérieur du bâtiment."
        );
        stopRecording();
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }

  function stopRecording() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setRecording(false);
  }

  async function saveWalk() {
    stopRecording();
    if (points.length === 0) return;
    const c = centroid(points);
    setError(null);
    try {
      await setGeofence.mutateAsync({
        geofenceLat: Number(c.lat.toFixed(6)),
        geofenceLng: Number(c.lng.toFixed(6)),
        geofenceRadiusM: effectiveRadiusM(points),
        geofencePoints: points,
      });
      setPoints([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    }
  }

  async function useCurrentPosition() {
    setError(null);
    try {
      const pos = await getCurrentPosition();
      const point: GeoPoint = { lat: pos.lat, lng: pos.lng, acc: pos.accuracy, ts: Date.now() };
      await setGeofence.mutateAsync({
        geofenceLat: Number(pos.lat.toFixed(6)),
        geofenceLng: Number(pos.lng.toFixed(6)),
        geofenceRadiusM: Math.max(DEFAULT_START_RADIUS_M, Math.round(pos.accuracy)),
        geofencePoints: [point],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'obtenir la position.");
    }
  }

  async function applyManualRadius() {
    const value = Number(manualRadius);
    if (!hasOnSite) {
      setError("Faites d'abord un relevé sur place avant d'ajuster le rayon.");
      return;
    }
    if (!Number.isFinite(value) || value < 10 || value > 2000) {
      setError("Le rayon doit être entre 10 et 2000 mètres.");
      return;
    }
    setError(null);
    try {
      await setGeofence.mutateAsync({
        geofenceLat: Number(store.geofenceLat),
        geofenceLng: Number(store.geofenceLng),
        geofenceRadiusM: Math.round(value),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour.");
    }
  }

  async function clearGeofence() {
    if (!confirm("Effacer le relevé sur place ? On retombera sur l'adresse géocodée (rayon 200 m).")) {
      return;
    }
    setError(null);
    try {
      await setGeofence.mutateAsync({
        geofenceLat: null,
        geofenceLng: null,
        geofenceRadiusM: null,
        geofencePoints: null,
      });
      setManualRadius("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la suppression.");
    }
  }

  const lastAcc = points.length ? points[points.length - 1].acc : undefined;
  const savedPointCount = store.geofencePoints?.length ?? 0;

  return (
    <div className="mt-8 rounded-2xl border border-canvas-200 bg-white p-6 shadow-sm shadow-canvas-900/5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-flow-100 text-flow-700">
          <IconMapPin className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-semibold text-canvas-900">Emplacement GPS sur place</h2>
          <p className="text-xs text-canvas-600">
            Sert à vérifier qu'un travailleur est bien au magasin avant de démarrer une tâche.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-canvas-50 p-4 text-sm">
        {hasOnSite ? (
          <p className="text-canvas-900">
            ✓ Relevé sur place enregistré — centre {Number(store.geofenceLat).toFixed(5)},{" "}
            {Number(store.geofenceLng).toFixed(5)} · rayon{" "}
            <span className="font-semibold">{store.geofenceRadiusM ?? DEFAULT_START_RADIUS_M} m</span>
            {savedPointCount > 0 && ` · ${savedPointCount} points relevés`}
          </p>
        ) : hasGeocoded ? (
          <p className="text-canvas-700">
            Aucun relevé sur place. On utilise l'adresse géocodée avec un rayon de{" "}
            {FALLBACK_START_RADIUS_M} m. Marchez autour du magasin pour resserrer à {DEFAULT_START_RADIUS_M} m.
          </p>
        ) : (
          <p className="text-red-700">
            ⚠ Aucune coordonnée GPS pour ce magasin. Les travailleurs ne pourront pas démarrer de tâche
            ici tant qu'un relevé sur place n'est pas fait (ou que l'adresse n'est pas géocodable).
          </p>
        )}
      </div>

      {recording && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-flow-50 p-3 text-sm ring-1 ring-flow-100">
          <span className="text-canvas-800">
            Enregistrement… <span className="font-semibold">{points.length}</span> points
            {lastAcc != null && ` · précision ~${Math.round(lastAcc)} m`}
          </span>
          <Button variant="secondary" onClick={stopRecording}>
            Arrêter
          </Button>
        </div>
      )}

      {!recording && points.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-linen-50 p-3 text-sm ring-1 ring-linen-200">
          <span className="text-canvas-800">
            {points.length} points relevés · rayon estimé ~{effectiveRadiusM(points)} m
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" onClick={() => setPoints([])} disabled={setGeofence.isPending}>
              Jeter
            </Button>
            <Button variant="accent" onClick={saveWalk} disabled={setGeofence.isPending}>
              {setGeofence.isPending ? "Enregistrement..." : "Enregistrer ce relevé"}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!recording && (
          <Button variant="primary" onClick={startRecording} disabled={setGeofence.isPending}>
            {points.length > 0 ? "Recommencer le relevé" : "Démarrer le relevé (marcher autour)"}
          </Button>
        )}
        {!recording && (
          <Button variant="secondary" onClick={useCurrentPosition} disabled={setGeofence.isPending}>
            Utiliser ma position actuelle
          </Button>
        )}
        {hasOnSite && !recording && (
          <Button variant="danger" onClick={clearGeofence} disabled={setGeofence.isPending}>
            Effacer le relevé
          </Button>
        )}
      </div>

      {hasOnSite && (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-canvas-600">
            Rayon manuel (m)
            <input
              type="number"
              min={10}
              max={2000}
              value={manualRadius}
              onChange={(e) => setManualRadius(e.target.value)}
              className="mt-1 block w-32 rounded-lg border border-canvas-300 bg-white px-3 py-2 text-sm text-canvas-900 focus:border-flow-400 focus:outline-none focus:ring-2 focus:ring-flow-200"
            />
          </label>
          <Button variant="secondary" onClick={applyManualRadius} disabled={setGeofence.isPending}>
            Appliquer le rayon
          </Button>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">{error}</p>
      )}
    </div>
  );
}
