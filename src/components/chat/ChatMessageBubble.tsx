import { useState, useCallback } from "react";
import { Globe, Volume2, Loader2, Languages, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
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

const TRANSLATE_ALL_LANGS = ["hi", "te", "ta", "mr", "gu", "kn", "ml", "bn", "od", "ur", "as", "en"];

const ChatMessageBubble = ({ msg, isMine, myLanguage, showOriginal, onToggleOriginal, currentUserId }: ChatMessageBubbleProps) => {
  const [speaking, setSpeaking] = useState(false);
  const [speakingLang, setSpeakingLang] = useState<string | null>(null);
  const [allTranslations, setAllTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [showAllTranslations, setShowAllTranslations] = useState(false);

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
    utterance.onstart = () => { setSpeaking(true); setSpeakingLang(lang); };
    utterance.onend = () => { setSpeaking(false); setSpeakingLang(null); };
    utterance.onerror = () => { setSpeaking(false); setSpeakingLang(null); };
    window.speechSynthesis.speak(utterance);
  }, []);

  const handlePlay = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeakingLang(null);
      return;
    }
    const textToSpeak = showTranslated && !showOriginal ? msg.translated_text! : msg.original_text;
    const lang = showTranslated && !showOriginal ? msg.target_language : msg.original_language;
    speakText(textToSpeak, lang);
  };

  const handleTranslateAll = async () => {
    if (translating) return;
    if (showAllTranslations && Object.keys(allTranslations).length > 0) {
      setShowAllTranslations(false);
      return;
    }
    if (Object.keys(allTranslations).length > 0) {
      setShowAllTranslations(true);
      return;
    }

    setTranslating(true);
    setShowAllTranslations(true);

    const langsToTranslate = TRANSLATE_ALL_LANGS.filter(code => code !== msg.original_language);

    const promises = langsToTranslate.map(async (lang) => {
      try {
        const { data, error } = await supabase.functions.invoke("translate-message", {
          body: {
            text: msg.original_text,
            source_language: msg.original_language,
            target_language: lang,
          },
        });
        if (!error && data?.translated_text) {
          setAllTranslations(prev => ({ ...prev, [lang]: data.translated_text }));
        }
      } catch (e) {
        console.error(`Translation to ${lang} failed:`, e);
      }
    });

    await Promise.all(promises);
    setTranslating(false);
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
                {speaking && speakingLang === null ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
                {speaking && speakingLang === null ? "Playing…" : "Play Voice"}
              </button>
            </div>
          )}

          {msg.original_text !== "📷 Image" && (
            <p className="text-sm whitespace-pre-wrap">{displayText}</p>
          )}

          {/* All translations block */}
          {showAllTranslations && (
            <div className={cn(
              "mt-2 pt-2 border-t space-y-2",
              isMine ? "border-primary-foreground/20" : "border-border"
            )}>
              {translating && Object.keys(allTranslations).length === 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className={isMine ? "text-primary-foreground/70" : "text-muted-foreground"}>
                    Translating to all languages…
                  </span>
                </div>
              )}
              {TRANSLATE_ALL_LANGS
                .filter(code => code !== msg.original_language && allTranslations[code])
                .map(code => (
                  <div key={code} className={cn(
                    "text-xs",
                    isMine ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">{LANG_NAMES[code]}:</span>
                      <button
                        onClick={() => speakText(allTranslations[code], code)}
                        className={cn(
                          "inline-flex items-center hover:opacity-80 transition-opacity",
                          isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}
                        title={`Listen in ${LANG_NAMES[code]}`}
                      >
                        {speaking && speakingLang === code ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap">{allTranslations[code]}</p>
                  </div>
                ))}
              {translating && Object.keys(allTranslations).length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  <span className={isMine ? "text-primary-foreground/50" : "text-muted-foreground/70"}>
                    Loading more…
                  </span>
                </div>
              )}
            </div>
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

            {/* Translate All button */}
            {msg.original_text !== "📷 Image" && (
              <button
                onClick={handleTranslateAll}
                className={cn(
                  "text-[10px] flex items-center gap-0.5 hover:underline",
                  isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                )}
                disabled={translating}
              >
                {translating ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : (
                  <Languages className="h-2.5 w-2.5" />
                )}
                Translate
                {showAllTranslations ? (
                  <ChevronUp className="h-2.5 w-2.5" />
                ) : (
                  <ChevronDown className="h-2.5 w-2.5" />
                )}
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
