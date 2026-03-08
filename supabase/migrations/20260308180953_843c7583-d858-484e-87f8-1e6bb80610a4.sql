
-- Add emergency_available to service_profiles
ALTER TABLE public.service_profiles ADD COLUMN IF NOT EXISTS emergency_available boolean NOT NULL DEFAULT false;

-- Add emergency fields to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS emergency_status text DEFAULT null;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS emergency_requested_at timestamptz DEFAULT null;

-- Update the booking notification trigger to handle emergency bookings
CREATE OR REPLACE FUNCTION public.create_booking_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  customer_name TEXT;
  service TEXT;
  notif_message TEXT;
  notif_type TEXT;
BEGIN
  SELECT p.name INTO customer_name FROM public.profiles p WHERE p.user_id = NEW.customer_id;
  SELECT sp.service_type INTO service FROM public.service_profiles sp WHERE sp.id = NEW.service_profile_id;
  
  IF NEW.is_emergency THEN
    notif_type := 'emergency_booking';
    notif_message := '🚨 Emergency Booking Request: ' || COALESCE(customer_name, 'Customer') || ' needs urgent ' || COALESCE(service, 'service') || ' immediately near your location. Date: ' || to_char(NEW.booking_date, 'DD Mon') || ' at ' || NEW.time_slot || '.';
  ELSE
    notif_type := 'new_booking';
    notif_message := 'New Booking Request: ' || COALESCE(customer_name, 'Customer') || ' has booked ' || COALESCE(service, 'a service') || ' for ' || to_char(NEW.booking_date, 'DD Mon') || ' at ' || NEW.time_slot || '.';
  END IF;
  
  INSERT INTO public.notifications (user_id, booking_id, notification_type, message)
  VALUES (NEW.provider_user_id, NEW.id, notif_type, notif_message);
  
  RETURN NEW;
END;
$function$;
