
-- Drop all restrictive SELECT policies on profiles and recreate as permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Customers can view provider profiles" ON public.profiles;
DROP POLICY IF EXISTS "Providers can view customer profiles for their bookings" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Customers can view provider profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM service_profiles WHERE service_profiles.user_id = profiles.user_id));
CREATE POLICY "Providers can view customer profiles for their bookings" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.provider_user_id = auth.uid() AND bookings.customer_id = profiles.user_id));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Drop all restrictive policies on user_roles and recreate as permissive
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix other tables too
DROP POLICY IF EXISTS "Anyone can view service profiles" ON public.service_profiles;
DROP POLICY IF EXISTS "Providers can insert own service profile" ON public.service_profiles;
DROP POLICY IF EXISTS "Providers can update own service profile" ON public.service_profiles;

CREATE POLICY "Anyone can view service profiles" ON public.service_profiles FOR SELECT USING (true);
CREATE POLICY "Providers can insert own service profile" ON public.service_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update own service profile" ON public.service_profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view provider availability" ON public.provider_availability;
DROP POLICY IF EXISTS "Providers can manage own availability" ON public.provider_availability;
DROP POLICY IF EXISTS "Providers can update own availability" ON public.provider_availability;
DROP POLICY IF EXISTS "Providers can delete own availability" ON public.provider_availability;

CREATE POLICY "Anyone can view provider availability" ON public.provider_availability FOR SELECT USING (true);
CREATE POLICY "Providers can manage own availability" ON public.provider_availability FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM service_profiles WHERE service_profiles.id = provider_availability.service_profile_id AND service_profiles.user_id = auth.uid()));
CREATE POLICY "Providers can update own availability" ON public.provider_availability FOR UPDATE USING (EXISTS (SELECT 1 FROM service_profiles WHERE service_profiles.id = provider_availability.service_profile_id AND service_profiles.user_id = auth.uid()));
CREATE POLICY "Providers can delete own availability" ON public.provider_availability FOR DELETE USING (EXISTS (SELECT 1 FROM service_profiles WHERE service_profiles.id = provider_availability.service_profile_id AND service_profiles.user_id = auth.uid()));

DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can update their bookings" ON public.bookings;

CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Providers can view their bookings" ON public.bookings FOR SELECT USING (auth.uid() = provider_user_id);
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Providers can update their bookings" ON public.bookings FOR UPDATE USING (auth.uid() = provider_user_id);

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can delete own reviews" ON public.reviews;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Customers can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Customers can delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = customer_id);
