import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { AppLayout } from "../components/common/AppLayout";
import { useStoreMapPoints } from "../hooks/useStores";

const storeMarkerIcon = L.divIcon({
  className: "",
  html: `<div style="
      width: 30px; height: 30px; border-radius: 9999px;
      background: #366d8b; border: 3px solid white;
      box-shadow: 0 2px 6px rgba(38,36,32,0.35);
    "></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const QUEBEC_CENTER: [number, number] = [46.8139, -71.208];

export function StoreMapPage() {
  const { data: points, isLoading } = useStoreMapPoints();

  return (
    <AppLayout>
      <Link to="/stores" className="text-sm text-flow-700 hover:text-flow-900">
        ← Tous les magasins
      </Link>

      <h1 className="font-heading mt-3 text-2xl font-semibold tracking-tight text-canvas-900">
        Carte des magasins
      </h1>
      <p className="mt-1 text-sm text-canvas-600">
        {points ? `${points.length} magasin${points.length === 1 ? "" : "s"} localisé${points.length === 1 ? "" : "s"}` : ""}
      </p>

      {isLoading && <p className="mt-6 text-sm text-canvas-600">Chargement...</p>}

      {points && points.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-canvas-300 bg-white px-6 py-16 text-center text-sm text-canvas-600">
          Aucun magasin n'a encore d'adresse géolocalisable. Ajoute une adresse à un magasin pour qu'il apparaisse ici.
        </p>
      )}

      {points && points.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-canvas-200 shadow-sm shadow-canvas-900/5">
          <MapContainer center={QUEBEC_CENTER} zoom={7} style={{ height: "560px", width: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.map((store) => (
              <Marker
                key={store.id}
                position={[Number(store.latitude), Number(store.longitude)]}
                icon={storeMarkerIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold text-canvas-900">{store.name}</p>
                    <p className="text-canvas-600">{store.address ?? store.city}</p>
                    <Link to={`/stores/${store.id}`} className="mt-1 inline-block text-flow-700 hover:underline">
                      Voir la fiche →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </AppLayout>
  );
}
