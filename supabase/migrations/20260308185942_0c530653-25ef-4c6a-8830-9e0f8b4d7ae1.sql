
-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  original_text TEXT NOT NULL,
  translated_text TEXT,
  original_language TEXT NOT NULL DEFAULT 'en',
  target_language TEXT NOT NULL DEFAULT 'en',
  message_type TEXT NOT NULL DEFAULT 'text',
  image_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Participants can view messages in their bookings
CREATE POLICY "Users can view messages for their bookings"
  ON public.chat_messages FOR SELECT
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Users can insert messages where they are the sender
CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Receiver can mark messages as read
CREATE POLICY "Users can update read status"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Admins can view all messages for dispute resolution
CREATE POLICY "Admins can view all messages"
  ON public.chat_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Create index for fast booking-based queries
CREATE INDEX idx_chat_messages_booking ON public.chat_messages(booking_id, created_at);
CREATE INDEX idx_chat_messages_receiver_unread ON public.chat_messages(receiver_id, is_read) WHERE is_read = false;
