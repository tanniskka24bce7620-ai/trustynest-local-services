
-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_code TEXT NOT NULL DEFAULT substr(md5((random())::text), 1, 8),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL,
  provider_user_id UUID NOT NULL,
  service_profile_id UUID NOT NULL REFERENCES public.service_profiles(id),
  complaint_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'low',
  status TEXT NOT NULL DEFAULT 'pending_review',
  evidence_urls TEXT[] DEFAULT '{}',
  resolution_action TEXT,
  resolution_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own complaints"
  ON public.complaints FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Providers can view complaints about them"
  ON public.complaints FOR SELECT USING (auth.uid() = provider_user_id);

CREATE POLICY "Admins can view all complaints"
  ON public.complaints FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Customers can insert complaints"
  ON public.complaints FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can update complaints"
  ON public.complaints FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-evidence', 'complaint-evidence', true);

CREATE POLICY "Users can upload evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complaint-evidence');

CREATE POLICY "Public evidence access"
  ON storage.objects FOR SELECT USING (bucket_id = 'complaint-evidence');

CREATE OR REPLACE FUNCTION public.create_complaint_notification()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE service TEXT;
BEGIN
  SELECT sp.service_type INTO service FROM public.service_profiles sp WHERE sp.id = NEW.service_profile_id;
  INSERT INTO public.notifications (user_id, notification_type, message)
  VALUES (NEW.provider_user_id, 'complaint',
    '🛡 A complaint has been filed regarding your ' || COALESCE(service, 'service') || ' service. Complaint ID: ' || UPPER(NEW.complaint_code) || '. Our team will review this shortly.');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_complaint_created
  AFTER INSERT ON public.complaints FOR EACH ROW
  EXECUTE FUNCTION public.create_complaint_notification();
