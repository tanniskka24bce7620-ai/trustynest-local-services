import { useState, useCallback } from "react";
import { Globe, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import MessageReactions from "./MessageReactions";

interface ChatMessage {
  id: string;
  sender_id: string;
  original_text: string;
  translated_text: string | null;
  original_language: string;
  target_language: string;
  message_type: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
}

interface ChatMessageBubbleProps {
  msg: ChatMessage;
  isMine: boolean;
  myLanguage: string;
  showOriginal: boolean;
  onToggleOriginal: (id: string) => void;
  currentUserId: string;
}

const LANG_NAMES: Record<string, string> = {
  en: "English", hi: "Hindi", te: "Telugu", ta: "Tamil", kn: "Kannada",
  ml: "Malayalam", bn: "Bengali", od: "Odia", mr: "Marathi", gu: "Gujarati",
  ur: "Urdu", as: "Assamese",
};

const SPEECH_LANG_CODES: Record<string, string> = {
  en: "en-US", hi: "hi-IN", te: "te-IN", ta: "ta-IN", kn: "kn-IN",
  ml: "ml-IN", bn: "bn-IN", od: "or-IN", mr: "mr-IN", gu: "gu-IN",
  ur: "ur-PK", as: "as-IN",
};

const ChatMessageBubble = ({ msg, isMine, myLanguage, showOriginal, onToggleOriginal, currentUserId }: ChatMessageBubbleProps) => {
  const [speaking, setSpeaking] = useState(false);

  const showTranslated = !isMine && msg.translated_text && msg.original_language !== myLanguage;
  const displayText = showOriginal
    ? msg.original_text
    : (showTranslated ? msg.translated_text : msg.original_text);
  const isVoice = msg.message_type === "voice";

  const speakText = useCallback((text: string, lang: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG_CODES[lang] || "en-US";
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const handlePlay = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const textToSpeak = showTranslated && !showOriginal ? msg.translated_text! : msg.original_text;
    const lang = showTranslated && !showOriginal ? msg.target_language : msg.original_language;
    speakText(textToSpeak, lang);
  };

  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div className="max-w-[75%]">
        <div className={cn(
          "rounded-2xl px-4 py-2.5 shadow-soft",
          isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"
        )}>
          {msg.message_type === "image" && msg.image_url && (
            <img src={msg.image_url} alt="Shared" className="rounded-lg mb-2 max-h-48 object-cover" />
          )}

          {isVoice && (
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={handlePlay}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1",
                  isMine ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"
                )}
              >
                {speaking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {speaking ? "Playing…" : "Play Voice"}
              </button>
            </div>
          )}

          {msg.original_text !== "📷 Image" && (
            <p className="text-sm whitespace-pre-wrap">{displayText}</p>
          )}

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={cn("text-[10px]", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>

            {isVoice && (
              <span className={cn("text-[10px] flex items-center gap-0.5", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
                🎤 Voice
              </span>
            )}

            {showTranslated && (
              <button
                onClick={() => onToggleOriginal(msg.id)}
                className={cn("text-[10px] flex items-center gap-0.5 hover:underline", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}
              >
                <Globe className="h-2.5 w-2.5" />
                {showOriginal
                  ? "View Translation"
                  : `Translated from ${LANG_NAMES[msg.original_language] || msg.original_language}`}
              </button>
            )}

            {!isVoice && msg.original_text !== "📷 Image" && (
              <button
                onClick={handlePlay}
                className={cn("text-[10px] flex items-center gap-0.5 hover:underline", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}
                title="Listen to message"
              >
                <Volume2 className="h-2.5 w-2.5" />
              </button>
            )}

            {isMine && (
              <span className={cn("text-[10px]", "text-primary-foreground/60")}>
                {msg.is_read ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        </div>

        <MessageReactions messageId={msg.id} userId={currentUserId} isMine={isMine} />
      </div>
    </div>
  );
};

export default ChatMessageBubble;
