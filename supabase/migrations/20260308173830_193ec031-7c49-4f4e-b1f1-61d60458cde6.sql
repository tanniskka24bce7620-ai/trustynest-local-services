
DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Trigger inserts notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
