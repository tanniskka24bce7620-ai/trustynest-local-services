import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Navigation, Phone, MessageCircle, MapPin, Clock } from "lucide-react";
import { useGeolocation, getDistanceKm } from "@/hooks/useGeolocation";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const customerIcon = L.divIcon({
  className: "bg-transparent",
  html: '<div style="font-size:28px;text-align:center;">🏠</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const providerIcon = L.divIcon({
  className: "bg-transparent",
  html: '<div style="font-size:28px;text-align:center;">🔧</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

interface Props {
  bookingId: string;
  customerLat: number;
  customerLng: number;
  customerName: string;
  customerContact?: string;
}

function FitRoute({ providerPos, customerPos }: { providerPos: [number, number] | null; customerPos: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const points = [customerPos];
    if (providerPos) points.push(providerPos);
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng))), { padding: [60, 60] });
    }
  }, [providerPos, customerPos, map]);
  return null;
}

const ProviderRouteMap = ({ bookingId, customerLat, customerLng, customerName, customerContact }: Props) => {
  const navigate = useNavigate();
  const { position } = useGeolocation();
  const customerPos: [number, number] = [customerLat, customerLng];
  const providerPos: [number, number] | null = position ? [position.latitude, position.longitude] : null;

  const distance = providerPos ? getDistanceKm(providerPos[0], providerPos[1], customerPos[0], customerPos[1]) : null;
  // Rough ETA: avg 25 km/h in city
  const etaMinutes = distance ? Math.round((distance / 25) * 60) : null;

  const openNavigation = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${customerLat},${customerLng}`, "_blank");
  };

  return (
    <div className="space-y-3">
      <div className="h-[300px] md:h-[400px] w-full rounded-xl overflow-hidden border border-border shadow-soft">
        <MapContainer center={customerPos} zoom={13} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitRoute providerPos={providerPos} customerPos={customerPos} />

          <Marker position={customerPos} icon={customerIcon}>
            <Popup>🏠 {customerName}'s Location</Popup>
          </Marker>

          {providerPos && (
            <>
              <Marker position={providerPos} icon={providerIcon}>
                <Popup>📍 Your Location</Popup>
              </Marker>
              <Polyline
                positions={[providerPos, customerPos]}
                pathOptions={{ color: "hsl(var(--primary))", weight: 3, dashArray: "8 6", opacity: 0.8 }}
              />
            </>
          )}
        </MapContainer>
      </div>

      {/* Info bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="font-semibold text-sm flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" /> {customerName}
            </p>
            {distance != null && (
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {distance.toFixed(1)} km away • ~{etaMinutes} min ETA
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {customerContact && (
              <Button size="sm" variant="outline" className="gap-1" asChild>
                <a href={`tel:${customerContact}`}><Phone className="h-3 w-3" /> Call</a>
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(`/chat/${bookingId}`)}>
              <MessageCircle className="h-3 w-3" /> Chat
            </Button>
            <Button size="sm" className="gap-1 gradient-hero border-0 text-primary-foreground" onClick={openNavigation}>
              <Navigation className="h-3 w-3" /> Navigate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderRouteMap;
