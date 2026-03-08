import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const customerIcon = L.divIcon({
  className: "bg-transparent",
  html: '<div style="width:28px;height:28px;border-radius:50%;background:hsl(214,80%,51%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="font-size:14px;">🏠</span></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const providerIcon = L.divIcon({
  className: "bg-transparent",
  html: '<div style="width:32px;height:32px;border-radius:50%;background:hsl(142,71%,45%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><span style="font-size:16px;">🔧</span></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface Props {
  bookingId: string;
  customerLat: number;
  customerLng: number;
  providerName: string;
  providerServiceType: string;
  providerRating: number;
  providerContact?: string;
  providerPhoto?: string;
  bookingStatus: string;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function AutoFitBounds({ providerPos, customerPos }: { providerPos: [number, number] | null; customerPos: [number, number] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (providerPos && !fitted.current) {
      map.fitBounds(L.latLngBounds([L.latLng(providerPos), L.latLng(customerPos)]), { padding: [60, 60] });
      fitted.current = true;
    }
  }, [providerPos, customerPos, map]);
  return null;
}

const BOOKING_STEPS = [
  { key: "confirmed", label: "Booking Confirmed", emoji: "✅" },
  { key: "on_the_way", label: "Provider On The Way", emoji: "🚗" },
  { key: "arriving", label: "Arriving Soon", emoji: "📍" },
  { key: "in_progress", label: "Service Started", emoji: "🔧" },
  { key: "completed", label: "Service Completed", emoji: "🎉" },
];

const LiveTrackingMap = ({
  bookingId, customerLat, customerLng, providerName, providerServiceType,
  providerRating, providerContact, providerPhoto, bookingStatus,
}: Props) => {
  const { toast } = useToast();
  const [providerPos, setProviderPos] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const customerPos: [number, number] = [customerLat, customerLng];

  // Calculate ETA (rough estimate ~30km/h avg city speed)
  const eta = providerPos ? Math.max(1, Math.round((getDistanceKm(providerPos[0], providerPos[1], customerLat, customerLng) / 30) * 60)) : null;
  const distance = providerPos ? getDistanceKm(providerPos[0], providerPos[1], customerLat, customerLng) : null;

  // Determine current step
  const getCurrentStep = () => {
    if (bookingStatus === "completed") return 4;
    if (bookingStatus === "in_progress") return 3;
    if (distance != null && distance < 0.5) return 2; // arriving
    if (providerPos) return 1; // on the way
    return 0; // confirmed
  };
  const currentStep = getCurrentStep();

  // Fetch initial location
  useEffect(() => {
    const fetchLocation = async () => {
      const { data } = await supabase
        .from("provider_locations")
        .select("latitude, longitude")
        .eq("booking_id", bookingId)
        .maybeSingle();
      if (data) {
        setProviderPos([(data as any).latitude, (data as any).longitude]);
      }
      setLoading(false);
    };
    fetchLocation();
  }, [bookingId]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`tracking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "provider_locations",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload: any) => {
          if (payload.new && payload.new.latitude && payload.new.longitude) {
            setProviderPos([payload.new.latitude, payload.new.longitude]);
          }
          if (payload.eventType === "DELETE") {
            setProviderPos(null);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  const handleShare = async () => {
    const url = `${window.location.origin}/track/${bookingId}`;
    if (navigator.share) {
      await navigator.share({ title: "Live Tracking", text: `Track ${providerName}'s live location`, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!", description: "Tracking link copied to clipboard." });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading tracking...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Provider Info Card */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <img
            src={providerPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(providerName)}&background=3b82f6&color=fff`}
            alt={providerName}
            className="h-12 w-12 rounded-full object-cover border-2 border-primary/20"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{providerName}</p>
            <p className="text-xs text-muted-foreground">{providerServiceType} • ⭐ {providerRating}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            {providerContact && (
              <a href={`tel:${providerContact}`}>
                <Button size="sm" variant="outline" className="gap-1">
                  <Phone className="h-3 w-3" /> Call
                </Button>
              </a>
            )}
            <Button size="sm" variant="outline" className="gap-1" onClick={handleShare}>
              <Share2 className="h-3 w-3" /> Share
            </Button>
          </div>
        </div>

        {/* ETA */}
        {providerPos && bookingStatus !== "completed" && (
          <div className="mt-3 flex items-center gap-3">
            <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/10 text-primary">
              🚗 Provider is on the way
            </Badge>
            {eta && (
              <span className="text-sm font-medium text-foreground">
                ETA: ~{eta} min ({distance?.toFixed(1)} km)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status Steps */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center justify-between">
          {BOOKING_STEPS.map((step, i) => (
            <div key={step.key} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {i > 0 && (
                  <div className={`h-0.5 flex-1 ${i <= currentStep ? "bg-primary" : "bg-muted"}`} />
                )}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm shrink-0 ${
                    i <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.emoji}
                </div>
                {i < BOOKING_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < currentStep ? "bg-primary" : "bg-muted"}`} />
                )}
              </div>
              <span className="mt-1 text-[9px] text-center text-muted-foreground leading-tight hidden sm:block">
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="h-[400px] md:h-[500px] w-full rounded-xl overflow-hidden border border-border shadow-soft">
        <MapContainer center={customerPos} zoom={13} className="h-full w-full" scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <AutoFitBounds providerPos={providerPos} customerPos={customerPos} />

          {/* Customer marker */}
          <Marker position={customerPos} icon={customerIcon}>
            <Popup>Your Location</Popup>
          </Marker>

          {/* Provider marker */}
          {providerPos && (
            <Marker position={providerPos} icon={providerIcon}>
              <Popup>{providerName} • {providerServiceType}</Popup>
            </Marker>
          )}

          {/* Route line */}
          {providerPos && (
            <Polyline
              positions={[providerPos, customerPos]}
              pathOptions={{ color: "hsl(214, 80%, 51%)", weight: 3, dashArray: "8 8" }}
            />
          )}
        </MapContainer>
      </div>

      {!providerPos && bookingStatus !== "completed" && (
        <p className="text-center text-sm text-muted-foreground">
          Waiting for provider to start trip... Location will appear on the map once they begin.
        </p>
      )}
    </div>
  );
};

export default LiveTrackingMap;
