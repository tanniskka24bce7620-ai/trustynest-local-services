import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Track online presence for a chat room using Supabase Realtime Presence */
export function usePresence(bookingId: string | undefined, userId: string | undefined) {
  const [partnerOnline, setPartnerOnline] = useState(false);

  useEffect(() => {
    if (!bookingId || !userId) return;

    const channel = supabase.channel(`presence-${bookingId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // Check if anyone other than me is present
        const onlineUsers = Object.keys(state);
        setPartnerOnline(onlineUsers.some((key) => key !== userId));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [bookingId, userId]);

  return { partnerOnline };
}
