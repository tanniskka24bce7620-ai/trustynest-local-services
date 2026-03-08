
-- Table for real-time provider location tracking
CREATE TABLE public.provider_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

-- Enable RLS
ALTER TABLE public.provider_locations ENABLE ROW LEVEL SECURITY;

-- Provider can upsert their own location
CREATE POLICY "Providers can upsert own location"
  ON public.provider_locations FOR INSERT
  WITH CHECK (auth.uid() = provider_user_id);

CREATE POLICY "Providers can update own location"
  ON public.provider_locations FOR UPDATE
  USING (auth.uid() = provider_user_id);

-- Customers can view location for their bookings
CREATE POLICY "Customers can view tracking for their bookings"
  ON public.provider_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = provider_locations.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Providers can view their own location records
CREATE POLICY "Providers can view own location"
  ON public.provider_locations FOR SELECT
  USING (auth.uid() = provider_user_id);

-- Admins can view all
CREATE POLICY "Admins can view all locations"
  ON public.provider_locations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Providers can delete own location (end tracking)
CREATE POLICY "Providers can delete own location"
  ON public.provider_locations FOR DELETE
  USING (auth.uid() = provider_user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_locations;
