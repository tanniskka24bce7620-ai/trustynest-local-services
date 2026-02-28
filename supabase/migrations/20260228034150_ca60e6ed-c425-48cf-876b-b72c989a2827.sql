
-- 1. Add unique constraint to prevent duplicate reviews
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_customer_service_unique 
UNIQUE (customer_id, service_profile_id);

-- 2. Restrict has_role function to only allow checking own roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() != _user_id THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 3. Fix profiles RLS: replace public SELECT with scoped policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Providers can view customer profiles for their bookings"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.provider_user_id = auth.uid()
    AND bookings.customer_id = profiles.user_id
  )
);

CREATE POLICY "Customers can view provider profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.service_profiles
    WHERE service_profiles.user_id = profiles.user_id
  )
);
