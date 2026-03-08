
ALTER TABLE public.service_profiles
ADD COLUMN latitude double precision DEFAULT NULL,
ADD COLUMN longitude double precision DEFAULT NULL;
