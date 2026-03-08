import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/authContext";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const LiveTrackingMap = lazy(() => import("@/components/LiveTrackingMap"));

interface TrackingData {
  bookingId: string;
  customerLat: number;
  customerLng: number;
  providerName: string;
  providerServiceType: string;
  providerRating: number;
  providerContact: string;
  providerPhoto: string;
  bookingStatus: string;
}

const TrackingPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !bookingId) return;
    const loadBooking = async () => {
      setLoading(true);
      const { data: booking, error: bErr } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();

      if (bErr || !booking) {
        setError("Booking not found.");
        setLoading(false);
        return;
      }

      const b = booking as any;

      // Get provider service profile and profile
      const { data: sp } = await supabase
        .from("service_profiles")
        .select("*")
        .eq("id", b.service_profile_id)
        .maybeSingle();

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", b.provider_user_id)
        .maybeSingle();

      // Get customer profile for location
      const { data: customerProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", b.customer_id)
        .maybeSingle();

      const spData = sp as any;
      const profileData = profile as any;

      // Use provider's service profile lat/lng as customer destination proxy
      // In real app, customer would have saved coordinates
      const customerLat = spData?.latitude || 20.5937;
      const customerLng = spData?.longitude || 78.9629;

      setData({
        bookingId: b.id,
        customerLat,
        customerLng,
        providerName: profileData?.name || "Provider",
        providerServiceType: spData?.service_type || "Service",
        providerRating: parseFloat(spData?.rating) || 0,
        providerContact: profileData?.contact || "",
        providerPhoto: profileData?.photo_url || "",
        bookingStatus: b.status,
      });
      setLoading(false);
    };
    loadBooking();
  }, [bookingId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "Unable to load tracking."}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Live Tracking</h1>
      </div>

      <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <LiveTrackingMap {...data} />
      </Suspense>
    </div>
  );
};

export default TrackingPage;
