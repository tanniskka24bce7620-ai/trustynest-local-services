import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Send, Globe, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  receiver_id: string;
  original_text: string;
  translated_text: string | null;
  original_language: string;
  target_language: string;
  message_type: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface ChatPartner {
  name: string;
  photo_url: string;
  language: string;
}

const ChatPage = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [partner, setPartner] = useState<ChatPartner | null>(null);
  const [myLanguage, setMyLanguage] = useState("en");
  const [showOriginal, setShowOriginal] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load booking info and partner details
  useEffect(() => {
    if (authLoading || !user || !bookingId) return;
    const load = async () => {
      setLoading(true);

      // Get booking
      const { data: booking } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", bookingId)
        .maybeSingle();
      if (!booking) { setLoading(false); return; }

      const b = booking as any;
      const partnerId = b.customer_id === user.id ? b.provider_user_id : b.customer_id;

      // Get partner profile
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("name, photo_url, language")
        .eq("user_id", partnerId)
        .maybeSingle();

      // Get my profile language
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("language")
        .eq("user_id", user.id)
        .maybeSingle();

      const pp = partnerProfile as any;
      setPartner({
        name: pp?.name || "User",
        photo_url: pp?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(pp?.name || "U")}&background=3b82f6&color=fff`,
        language: pp?.language || "en",
      });
      setMyLanguage((myProfile as any)?.language || "en");

      // Load existing messages
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });
      setMessages((msgs as ChatMessage[]) || []);

      // Mark unread messages as read
      await supabase
        .from("chat_messages")
        .update({ is_read: true } as any)
        .eq("booking_id", bookingId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      setLoading(false);
    };
    load();
  }, [bookingId, user, authLoading]);

  // Realtime subscription
  useEffect(() => {
    if (!bookingId) return;
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Auto mark as read if we're the receiver
          if (user && newMsg.receiver_id === user.id) {
            supabase.from("chat_messages").update({ is_read: true } as any).eq("id", newMsg.id).then();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId, user]);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(async (text: string, imageUrl?: string) => {
    if (!user || !bookingId || !partner) return;
    if (!text.trim() && !imageUrl) return;
    setSending(true);

    const { data: booking } = await supabase
      .from("bookings")
      .select("customer_id, provider_user_id")
      .eq("id", bookingId)
      .maybeSingle();
    if (!booking) { setSending(false); return; }

    const b = booking as any;
    const receiverId = b.customer_id === user.id ? b.provider_user_id : b.customer_id;

    // Translate if languages differ
    let translatedText: string | null = null;
    if (myLanguage !== partner.language && text.trim()) {
      try {
        const { data: translationData, error: translationError } = await supabase.functions.invoke("translate-message", {
          body: { text: text.trim(), source_language: myLanguage, target_language: partner.language },
        });
        if (!translationError && translationData?.translated_text) {
          translatedText = translationData.translated_text;
        }
      } catch (e) {
        console.error("Translation failed:", e);
      }
    }

    const messageData = {
      booking_id: bookingId,
      sender_id: user.id,
      receiver_id: receiverId,
      original_text: text.trim() || "📷 Image",
      translated_text: translatedText,
      original_language: myLanguage,
      target_language: partner.language,
      message_type: imageUrl ? "image" : "text",
      image_url: imageUrl || null,
    };

    await supabase.from("chat_messages").insert(messageData as any);
    setInput("");
    setSending(false);
  }, [user, bookingId, partner, myLanguage]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5 MB", variant: "destructive" });
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `chat/${bookingId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("complaint-evidence").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("complaint-evidence").getPublicUrl(path);
    await sendMessage("", urlData.publicUrl);
  };

  const toggleOriginal = (id: string) => {
    setShowOriginal((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const LANG_NAMES: Record<string, string> = {
    en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada",
    ml: "Malayalam", bn: "Bengali", od: "Odia", mr: "Marathi", gu: "Gujarati",
    ur: "Urdu", as: "Assamese",
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        {partner && (
          <div className="flex items-center gap-3 flex-1">
            <img
              src={partner.photo_url}
              alt={partner.name}
              className="h-9 w-9 rounded-full object-cover border border-border"
            />
            <div>
              <p className="font-semibold text-sm">{partner.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" /> {LANG_NAMES[partner.language] || partner.language}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Globe className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Start a conversation. Messages will be automatically translated.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          const showTranslated = !isMine && msg.translated_text && msg.original_language !== myLanguage;
          const displayText = showOriginal.has(msg.id)
            ? msg.original_text
            : (showTranslated ? msg.translated_text : msg.original_text);
          const isTranslatedView = showTranslated && !showOriginal.has(msg.id);

          return (
            <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%] rounded-2xl px-4 py-2.5 shadow-soft", isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md")}>
                {msg.message_type === "image" && msg.image_url && (
                  <img src={msg.image_url} alt="Shared" className="rounded-lg mb-2 max-h-48 object-cover" />
                )}
                {msg.original_text !== "📷 Image" && (
                  <p className="text-sm whitespace-pre-wrap">{displayText}</p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  <span className={cn("text-[10px]", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>

                  {showTranslated && (
                    <button
                      onClick={() => toggleOriginal(msg.id)}
                      className={cn("text-[10px] flex items-center gap-0.5 hover:underline", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}
                    >
                      <Globe className="h-2.5 w-2.5" />
                      {showOriginal.has(msg.id)
                        ? "View Translation"
                        : `Translated from ${LANG_NAMES[msg.original_language] || msg.original_language}`}
                    </button>
                  )}

                  {isMine && (
                    <span className={cn("text-[10px]", "text-primary-foreground/60")}>
                      {msg.is_read ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card px-4 py-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="sm" disabled={sending || !input.trim()} className="shrink-0 gradient-hero border-0 text-primary-foreground">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
