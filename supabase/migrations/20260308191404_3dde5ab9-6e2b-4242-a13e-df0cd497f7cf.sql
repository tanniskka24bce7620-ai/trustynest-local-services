ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS customer_latitude double precision,
ADD COLUMN IF NOT EXISTS customer_longitude double precision,
ADD COLUMN IF NOT EXISTS customer_address text;