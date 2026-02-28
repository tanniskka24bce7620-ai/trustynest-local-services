
-- 1. Add aadhaar_hash column for storing hashed aadhaar numbers
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS aadhaar_hash TEXT;

-- 2. Unique constraint to prevent duplicate aadhaar usage
ALTER TABLE public.profiles ADD CONSTRAINT profiles_aadhaar_hash_unique UNIQUE (aadhaar_hash);

-- 3. Revoke direct UPDATE on aadhaar_verified and aadhaar_hash from authenticated users
-- We use a trigger to prevent client-side modifications to these columns
CREATE OR REPLACE FUNCTION public.prevent_aadhaar_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role (edge functions) to update these fields
  -- current_setting('role') = 'service_role' when using service key
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block authenticated users from changing aadhaar fields
  IF NEW.aadhaar_verified IS DISTINCT FROM OLD.aadhaar_verified THEN
    RAISE EXCEPTION 'Cannot modify aadhaar_verified directly. Use the verification endpoint.';
  END IF;

  IF NEW.aadhaar_hash IS DISTINCT FROM OLD.aadhaar_hash THEN
    RAISE EXCEPTION 'Cannot modify aadhaar_hash directly. Use the verification endpoint.';
  END IF;

  IF NEW.aadhaar_verified_at IS DISTINCT FROM OLD.aadhaar_verified_at THEN
    RAISE EXCEPTION 'Cannot modify aadhaar_verified_at directly. Use the verification endpoint.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_aadhaar_self_update_trigger ON public.profiles;
CREATE TRIGGER prevent_aadhaar_self_update_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_aadhaar_self_update();
