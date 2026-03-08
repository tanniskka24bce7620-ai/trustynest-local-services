import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/authContext";
import { Loader2, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatThread {
  bookingId: string;
  partnerName: string;
  partnerPhoto: string;
  serviceType: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const ChatListPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      setLoading(true);

      // Get all bookings where user is customer or provider
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, customer_id, provider_user_id, service_profile_id, status")
        .or(`customer_id.eq.${user.id},provider_user_id.eq.${user.id}`);

      if (!bookings || bookings.length === 0) {
        setLoading(false);
        return;
      }

      const bookingList = bookings as any[];

      // Get partner profiles, service types, and messages in parallel
      const partnerIds = bookingList.map((b) =>
        b.customer_id === user.id ? b.provider_user_id : b.customer_id
      );
      const spIds = bookingList.map((b) => b.service_profile_id);
      const bookingIds = bookingList.map((b) => b.id);

      const [{ data: profiles }, { data: serviceProfiles }, { data: messages }] = await Promise.all([
        supabase.from("profiles").select("user_id, name, photo_url").in("user_id", partnerIds),
        supabase.from("service_profiles").select("id, service_type").in("id", spIds),
        supabase.from("chat_messages").select("booking_id, original_text, created_at, sender_id, is_read, receiver_id").in("booking_id", bookingIds).order("created_at", { ascending: false }),
      ]);

      const profileMap = new Map((profiles as any[] || []).map((p) => [p.user_id, p]));
      const spMap = new Map((serviceProfiles as any[] || []).map((s) => [s.id, s]));
      const msgList = (messages as any[]) || [];

      const result: ChatThread[] = bookingList
        .map((b) => {
          const partnerId = b.customer_id === user.id ? b.provider_user_id : b.customer_id;
          const partner = profileMap.get(partnerId);
          const sp = spMap.get(b.service_profile_id);
          const bookingMsgs = msgList.filter((m) => m.booking_id === b.id);
          const lastMsg = bookingMsgs[0];
          const unread = bookingMsgs.filter((m) => m.receiver_id === user.id && !m.is_read).length;

          return {
            bookingId: b.id,
            partnerName: partner?.name || "User",
            partnerPhoto: partner?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner?.name || "U")}&background=3b82f6&color=fff`,
            serviceType: sp?.service_type || "Service",
            lastMessage: lastMsg?.original_text || "No messages yet",
            lastMessageTime: lastMsg?.created_at || b.created_at || "",
            unreadCount: unread,
          };
        })
        .filter((t) => t.lastMessageTime)
        .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      setThreads(result);
      setLoading(false);
    };

    load();
  }, [user, authLoading]);

  // Realtime: refresh on new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat-list-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => {
        // Trigger reload by re-running effect
        window.dispatchEvent(new Event("chat-list-refresh"));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <MessageCircle className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Chats</h1>
        </div>

        {threads.length === 0 ? (
          <div className="text-center py-16 px-4">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No conversations yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Chat threads will appear here when you or a provider sends a message on a booking.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {threads.map((t) => (
              <button
                key={t.bookingId}
                onClick={() => navigate(`/chat/${t.bookingId}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
              >
                <img
                  src={t.partnerPhoto}
                  alt={t.partnerName}
                  className="h-11 w-11 rounded-full object-cover border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("font-semibold text-sm truncate", t.unreadCount > 0 && "text-foreground")}>
                      {t.partnerName}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {t.lastMessageTime ? formatTime(t.lastMessageTime) : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={cn("text-xs truncate", t.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {t.lastMessage}
                    </p>
                    {t.unreadCount > 0 && (
                      <Badge className="h-5 min-w-[20px] flex items-center justify-center rounded-full text-[10px] px-1.5 bg-primary text-primary-foreground shrink-0">
                        {t.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.serviceType}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 172800000) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default ChatListPage;
