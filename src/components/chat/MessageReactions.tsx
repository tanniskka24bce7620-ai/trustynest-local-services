import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "🙏"];

interface Reaction {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface MessageReactionsProps {
  messageId: string;
  userId: string;
  isMine: boolean;
}

const MessageReactions = ({ messageId, userId, isMine }: MessageReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const loadReactions = useCallback(async () => {
    const { data } = await supabase
      .from("message_reactions")
      .select("emoji, user_id")
      .eq("message_id", messageId) as any;

    if (!data) return;

    const map = new Map<string, { count: number; hasReacted: boolean }>();
    for (const r of data) {
      const existing = map.get(r.emoji) || { count: 0, hasReacted: false };
      existing.count++;
      if (r.user_id === userId) existing.hasReacted = true;
      map.set(r.emoji, existing);
    }

    setReactions(
      Array.from(map.entries()).map(([emoji, v]) => ({ emoji, ...v }))
    );
  }, [messageId, userId]);

  useEffect(() => {
    loadReactions();
  }, [loadReactions]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${messageId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions", filter: `message_id=eq.${messageId}` }, () => {
        loadReactions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [messageId, loadReactions]);

  const toggleReaction = async (emoji: string) => {
    const existing = reactions.find((r) => r.emoji === emoji);
    if (existing?.hasReacted) {
      await supabase
        .from("message_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", userId)
        .eq("emoji", emoji) as any;
    } else {
      await supabase
        .from("message_reactions")
        .insert({ message_id: messageId, user_id: userId, emoji } as any) as any;
    }
    setShowPicker(false);
    loadReactions();
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1 mt-1", isMine ? "justify-end" : "justify-start")}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          className={cn(
            "inline-flex items-center gap-0.5 text-[11px] rounded-full px-1.5 py-0.5 border transition-colors",
            r.hasReacted
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          {r.emoji} <span className="text-[10px]">{r.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-1"
          title="React"
        >
          +😊
        </button>
        {showPicker && (
          <div className={cn(
            "absolute bottom-6 z-20 flex gap-1 rounded-lg border border-border bg-card p-1.5 shadow-lg",
            isMine ? "right-0" : "left-0"
          )}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="text-lg hover:scale-125 transition-transform px-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
