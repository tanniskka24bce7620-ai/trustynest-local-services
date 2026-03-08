import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ServiceProvider } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  providers: (ServiceProvider & { distance?: number })[];
  center: [number, number];
}

function FitBounds({ providers, center }: { providers: Props["providers"]; center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = providers
      .filter((p) => (p as any).latitude && (p as any).longitude)
      .map((p) => [(p as any).latitude, (p as any).longitude]);
    points.push(center);
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng))), { padding: [40, 40] });
    }
  }, [providers, center, map]);
  return null;
}

const ProviderMapView = ({ providers, center }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const mappable = providers.filter((p) => (p as any).latitude && (p as any).longitude);

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-border shadow-soft">
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds providers={mappable} center={center} />

        {/* Customer position marker */}
        <Marker position={center} icon={L.divIcon({ className: "bg-transparent", html: '<div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })}>
          <Popup>Your Location</Popup>
        </Marker>

        {mappable.map((p) => (
          <Marker key={p.id} position={[(p as any).latitude, (p as any).longitude]}>
            <Popup minWidth={200}>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.serviceType}</p>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{p.rating}</span>
                </div>
                {p.distance != null && (
                  <p className="text-xs font-medium text-blue-600">{p.distance.toFixed(1)} km away</p>
                )}
                <Button size="sm" className="w-full mt-1 h-7 text-xs" onClick={() => navigate(`/book?sp=${p.id}`)}>
                  {t("providerCard.bookService")}
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default ProviderMapView;
