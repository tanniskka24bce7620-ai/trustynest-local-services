import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  language: string;
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

const LANG_CODES: Record<string, string> = {
  en: "en-US", hi: "hi-IN", te: "te-IN", ta: "ta-IN", kn: "kn-IN",
  ml: "ml-IN", bn: "bn-IN", od: "or-IN", mr: "mr-IN", gu: "gu-IN",
  ur: "ur-IN", as: "as-IN",
};

const VoiceRecorder = ({ language, onTranscript, disabled }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Voice recording is not supported in this browser.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = LANG_CODES[language] || "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        onTranscript(transcript.trim());
      }
      setProcessing(false);
      setRecording(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "aborted") {
        toast({ title: "Voice recognition failed", description: "Please try again or type your message.", variant: "destructive" });
      }
      setProcessing(false);
      setRecording(false);
    };

    recognition.onend = () => {
      setProcessing(false);
      setRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }, [language, onTranscript, toast]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      setProcessing(true);
      recognitionRef.current.stop();
    }
  }, []);

  if (processing) {
    return (
      <Button type="button" variant="ghost" size="sm" disabled className="shrink-0">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={recording ? stopRecording : startRecording}
      disabled={disabled}
      className={cn("shrink-0 relative", recording && "text-destructive")}
      title={recording ? "Stop recording" : "Send voice message – automatically translated"}
    >
      {recording ? (
        <>
          <Square className="h-4 w-4 fill-current" />
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
        </>
      ) : (
        <Mic className="h-5 w-5 text-muted-foreground" />
      )}
    </Button>
  );
};

export default VoiceRecorder;
