import { useState, useEffect, useCallback } from "react";

interface GeoPosition {
  latitude: number;
  longitude: number;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  requestLocation: () => void;
  denied: boolean;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(() => {
    const cached = sessionStorage.getItem("user_geo");
    return cached ? JSON.parse(cached) : null;
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setDenied(true);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const geo = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setPosition(geo);
        sessionStorage.setItem("user_geo", JSON.stringify(geo));
        setLoading(false);
        setDenied(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) setDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (!position) requestLocation();
  }, []);

  return { position, error, loading, requestLocation, denied };
}

/** Haversine formula — returns distance in km */
export function getDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
