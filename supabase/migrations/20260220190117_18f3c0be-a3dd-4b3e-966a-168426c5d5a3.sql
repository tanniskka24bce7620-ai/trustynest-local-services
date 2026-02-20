
-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  service_profile_id UUID NOT NULL REFERENCES public.service_profiles(id),
  provider_user_id UUID NOT NULL,
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  service_note TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  cancellation_reason TEXT DEFAULT '',
  booking_code TEXT NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Providers can view their bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = provider_user_id);

CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = customer_id);

CREATE POLICY "Providers can update their bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = provider_user_id);

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Provider availability settings (provider-customizable slots)
CREATE TABLE public.provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_profile_id UUID NOT NULL REFERENCES public.service_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_hour INTEGER NOT NULL DEFAULT 8 CHECK (start_hour BETWEEN 0 AND 23),
  end_hour INTEGER NOT NULL DEFAULT 20 CHECK (end_hour BETWEEN 1 AND 24),
  slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(service_profile_id, day_of_week)
);

ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view provider availability"
  ON public.provider_availability FOR SELECT
  USING (true);

CREATE POLICY "Providers can manage own availability"
  ON public.provider_availability FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.service_profiles WHERE id = service_profile_id AND user_id = auth.uid())
  );

CREATE POLICY "Providers can update own availability"
  ON public.provider_availability FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.service_profiles WHERE id = service_profile_id AND user_id = auth.uid())
  );

CREATE POLICY "Providers can delete own availability"
  ON public.provider_availability FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.service_profiles WHERE id = service_profile_id AND user_id = auth.uid())
  );
