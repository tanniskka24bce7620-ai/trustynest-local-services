import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SERVICE_TYPES } from "@/lib/mockData";

// Language code mapping for SpeechRecognition BCP-47 locales
const LANG_TO_BCP47: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  bn: "bn-IN",
  od: "or-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  ur: "ur-IN",
  as: "as-IN",
};

// Keyword aliases mapped to SERVICE_TYPES entries (lowercase)
const SERVICE_KEYWORDS: Record<string, string> = {
  // English
  plumber: "Plumber",
  plumbing: "Plumber",
  electrician: "Electrician",
  electrical: "Electrician",
  carpenter: "Carpenter",
  carpentry: "Carpenter",
  painter: "Painter",
  painting: "Painter",
  tailor: "Tailor",
  tailoring: "Tailor",
  mechanic: "Mechanic",
  maid: "House Maid",
  "house maid": "House Maid",
  housemaid: "House Maid",
  mehendi: "Mehendi Artist",
  mehndi: "Mehendi Artist",
  henna: "Mehendi Artist",
  cobbler: "Cobbler",
  washerman: "Washerman",
  laundry: "Washerman",
  "iron man": "Iron Man",
  ironing: "Iron Man",
  "ac repair": "AC Repair",
  ac: "AC Repair",
  // Hindi keywords
  प्लंबर: "Plumber",
  इलेक्ट्रीशियन: "Electrician",
  बिजली: "Electrician",
  बढ़ई: "Carpenter",
  पेंटर: "Painter",
  दर्जी: "Tailor",
  मिस्त्री: "Mechanic",
  मेहंदी: "Mehendi Artist",
  मोची: "Cobbler",
  धोबी: "Washerman",
  // Tamil keywords
  பிளம்பர்: "Plumber",
  எலக்ட்ரீஷியன்: "Electrician",
  தச்சர்: "Carpenter",
  // Telugu keywords
  ప్లంబర్: "Plumber",
  ఎలక్ట్రీషియన్: "Electrician",
};

const NEAR_ME_KEYWORDS = [
  "near me", "nearby", "near by", "closest", "around me",
  "मेरे पास", "पास में", "आस पास",
  "என் அருகில்", "அருகில்",
  "నా దగ్గర", "సమీపంలో",
];

interface UseVoiceSearchReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  supported: boolean;
  startListening: () => void;
  stopListening: () => void;
  matchedCategory: string | null;
  wantsNearby: boolean;
}

export function useVoiceSearch(): UseVoiceSearchReturn {
  const { i18n } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const supported = !!SpeechRecognition;

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError("voiceSearch.notSupported");
      return;
    }

    setError(null);
    setTranscript("");

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = LANG_TO_BCP47[i18n.language] || "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      setTranscript(result[0].transcript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed") {
        setError("voiceSearch.micDenied");
      } else if (event.error === "no-speech") {
        setError("voiceSearch.noSpeech");
      } else {
        setError("voiceSearch.error");
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  }, [SpeechRecognition, i18n.language]);

  // Cleanup on unmount
  useEffect(() => {
    return () => recognitionRef.current?.abort();
  }, []);

  // Extract matched category
  const lowerTranscript = transcript.toLowerCase();
  let matchedCategory: string | null = null;

  // Check longest keywords first to avoid partial matches
  const sortedKeywords = Object.keys(SERVICE_KEYWORDS).sort((a, b) => b.length - a.length);
  for (const keyword of sortedKeywords) {
    if (lowerTranscript.includes(keyword)) {
      matchedCategory = SERVICE_KEYWORDS[keyword];
      break;
    }
  }

  const wantsNearby = NEAR_ME_KEYWORDS.some((kw) => lowerTranscript.includes(kw));

  return {
    isListening,
    transcript,
    error,
    supported,
    startListening,
    stopListening,
    matchedCategory,
    wantsNearby,
  };
}
