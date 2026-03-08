import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Hook for providers to broadcast their live location for a booking */
export function useProviderTracking(bookingId: string | null, userId: string | null) {
  const [tracking, setTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestPos = useRef<{ lat: number; lng: number } | null>(null);

  const startTracking = useCallback(async () => {
    if (!bookingId || !userId || !navigator.geolocation) return;

    setTracking(true);

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        latestPos.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    // Send updates every 8 seconds
    const sendUpdate = async () => {
      if (!latestPos.current) return;
      await supabase.from("provider_locations").upsert(
        {
          booking_id: bookingId,
          provider_user_id: userId,
          latitude: latestPos.current.lat,
          longitude: latestPos.current.lng,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "booking_id" }
      );
    };

    // Send initial position after a short delay
    setTimeout(sendUpdate, 2000);
    intervalRef.current = setInterval(sendUpdate, 8000);
  }, [bookingId, userId]);

  const stopTracking = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    latestPos.current = null;
    setTracking(false);

    // Remove location record
    if (bookingId) {
      await supabase.from("provider_locations").delete().eq("booking_id", bookingId);
    }
  }, [bookingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { tracking, startTracking, stopTracking };
}
