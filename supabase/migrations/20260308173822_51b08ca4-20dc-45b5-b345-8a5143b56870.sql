
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'new_booking',
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies (permissive)
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function to auto-create notification on booking insert
CREATE OR REPLACE FUNCTION public.create_booking_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_name TEXT;
  service TEXT;
  provider_area TEXT;
  provider_city TEXT;
  notif_message TEXT;
BEGIN
  SELECT p.name INTO customer_name FROM public.profiles p WHERE p.user_id = NEW.customer_id;
  SELECT sp.service_type INTO service FROM public.service_profiles sp WHERE sp.id = NEW.service_profile_id;
  
  notif_message := 'New Booking Request: ' || COALESCE(customer_name, 'Customer') || ' has booked ' || COALESCE(service, 'a service') || ' for ' || to_char(NEW.booking_date, 'DD Mon') || ' at ' || NEW.time_slot || '.';
  
  INSERT INTO public.notifications (user_id, booking_id, notification_type, message)
  VALUES (NEW.provider_user_id, NEW.id, 'new_booking', notif_message);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_created_notify
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_notification();

-- Trigger for booking status changes (cancel, reschedule, complete)
CREATE OR REPLACE FUNCTION public.create_booking_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_name TEXT;
  service TEXT;
  notif_message TEXT;
  notif_type TEXT;
  target_user UUID;
BEGIN
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;
  
  SELECT p.name INTO customer_name FROM public.profiles p WHERE p.user_id = NEW.customer_id;
  SELECT sp.service_type INTO service FROM public.service_profiles sp WHERE sp.id = NEW.service_profile_id;
  
  IF NEW.status = 'cancelled' THEN
    notif_type := 'cancel';
    notif_message := 'Booking Cancelled: ' || COALESCE(service, 'Service') || ' booking on ' || to_char(NEW.booking_date, 'DD Mon') || ' at ' || NEW.time_slot || ' has been cancelled.';
    target_user := NEW.provider_user_id;
  ELSIF NEW.status = 'confirmed' THEN
    notif_type := 'confirmed';
    notif_message := 'Booking Confirmed: Your ' || COALESCE(service, 'service') || ' booking on ' || to_char(NEW.booking_date, 'DD Mon') || ' at ' || NEW.time_slot || ' has been confirmed.';
    target_user := NEW.customer_id;
  ELSIF NEW.status = 'completed' THEN
    notif_type := 'completed';
    notif_message := 'Booking Completed: ' || COALESCE(service, 'Service') || ' booking on ' || to_char(NEW.booking_date, 'DD Mon') || ' has been marked as completed.';
    target_user := NEW.customer_id;
  ELSE
    RETURN NEW;
  END IF;
  
  INSERT INTO public.notifications (user_id, booking_id, notification_type, message)
  VALUES (target_user, NEW.id, notif_type, notif_message);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_status_changed_notify
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_status_notification();
