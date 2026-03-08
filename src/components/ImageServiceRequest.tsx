import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_ICONS, SERVICE_TYPES } from "@/lib/mockData";
import ServiceProviderCard from "@/components/ServiceProviderCard";
import ProviderProfile from "@/components/ProviderProfile";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Loader2, ImageIcon, X, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ServiceProvider } from "@/lib/mockData";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AnalysisResult {
  category: string;
  confidence: number;
  description: string;
}

const ImageServiceRequest = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [manualCategory, setManualCategory] = useState<string | null>(null);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const activeCategory = manualCategory || result?.category;

  const validateFile = (f: File): boolean => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast({ title: t("imageRequest.invalidFormat"), variant: "destructive" });
      return false;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast({ title: t("imageRequest.tooLarge"), variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleFile = useCallback(async (f: File) => {
    if (!validateFile(f)) return;
    setFile(f);
    setResult(null);
    setManualCategory(null);
    setProviders([]);

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);

    // Analyze
    setAnalyzing(true);
    try {
      const base64Reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        base64Reader.onload = () => {
          const dataUrl = base64Reader.result as string;
          resolve(dataUrl.split(",")[1]);
        };
      });
      base64Reader.readAsDataURL(f);
      const base64 = await base64Promise;

      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { image_base64: base64, mime_type: f.type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as AnalysisResult);
      loadProvidersByCategory(data.category);
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast({ title: t("imageRequest.analysisFailed"), description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const loadProvidersByCategory = async (category: string) => {
    setLoadingProviders(true);
    const { data: serviceProfiles } = await supabase
      .from("service_profiles")
      .select("*")
      .eq("service_type", category)
      .eq("available", true);

    if (!serviceProfiles || (serviceProfiles as any[]).length === 0) {
      setProviders([]);
      setLoadingProviders(false);
      return;
    }

    const userIds = (serviceProfiles as any[]).map((sp: any) => sp.user_id);
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
    const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.user_id, p]));

    const mapped: ServiceProvider[] = (serviceProfiles as any[]).map((sp: any) => {
      const profile = profileMap.get(sp.user_id) as any;
      return {
        id: sp.id,
        name: profile?.name || "Unknown",
        age: sp.age || 0,
        experience: sp.experience || 0,
        contact: profile?.contact || "",
        serviceType: sp.service_type,
        city: profile?.city || "",
        area: profile?.area || "",
        bio: sp.bio || "",
        photo: profile?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || "U")}&background=3b82f6&color=fff`,
        available: sp.available,
        verified: profile?.aadhaar_verified || false,
        rating: parseFloat(sp.rating) || 0,
        reviewCount: sp.review_count || 0,
        latitude: sp.latitude,
        longitude: sp.longitude,
        reviews: [],
      };
    });
    setProviders(mapped);
    setLoadingProviders(false);
  };

  const handleManualCategory = (cat: string) => {
    setManualCategory(cat);
    loadProvidersByCategory(cat);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    setResult(null);
    setManualCategory(null);
    setProviders([]);
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{t("imageRequest.title")}</h2>
          <p className="text-muted-foreground">{t("imageRequest.subtitle")}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Upload Area */}
          {!preview && (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-all cursor-pointer ${
                dragActive
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{t("imageRequest.dragDrop")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("imageRequest.formats")}</p>
                </div>
                <div className="flex gap-3 mt-2">
                  <Button
                    variant="default"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    <Upload className="h-4 w-4 mr-2" /> {t("imageRequest.uploadBtn")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                    className="md:hidden"
                  >
                    <Camera className="h-4 w-4 mr-2" /> {t("imageRequest.cameraBtn")}
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          )}

          {/* Preview + Analysis */}
          {preview && (
            <div className="space-y-4">
              <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
                <img src={preview} alt="Uploaded" className="w-full max-h-[300px] object-contain bg-muted" />
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur p-1.5 hover:bg-background transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Analyzing State */}
              {analyzing && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center animate-pulse">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="font-semibold text-primary">{t("imageRequest.analyzing")}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("imageRequest.analyzingDesc")}</p>
                </div>
              )}

              {/* Result */}
              {result && !analyzing && (
                <div className="rounded-xl border border-success/30 bg-success/5 p-5 animate-fade-in">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-6 w-6 text-success" />
                    <div>
                      <p className="font-semibold">{t("imageRequest.suggestedService")}</p>
                      <p className="text-sm text-muted-foreground">{result.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="text-lg px-4 py-1.5 bg-primary/10 text-primary border-primary/30">
                      {SERVICE_ICONS[result.category]} {result.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(result.confidence * 100)}% {t("imageRequest.confidence")}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Manual override */}
              {(result || !analyzing) && !analyzing && (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm text-muted-foreground">{t("imageRequest.notCorrect")}</p>
                  <Select value={manualCategory || ""} onValueChange={handleManualCategory}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder={t("imageRequest.chooseManually")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SERVICE_ICONS[s]} {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Providers */}
              {activeCategory && !analyzing && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">
                    {SERVICE_ICONS[activeCategory]} {t("imageRequest.suggestedProviders", { category: activeCategory })}
                  </h3>
                  {loadingProviders ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-8" />
                  ) : providers.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {providers.map((p) => (
                        <ServiceProviderCard key={p.id} provider={p} onViewProfile={setSelectedProvider} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-card p-8 text-center">
                      <AlertCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">{t("imageRequest.noProviders")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Login prompt for unauthenticated users */}
          {!user && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t("imageRequest.loginRequired")}
            </p>
          )}
        </div>

        {/* Transparency note */}
        <p className="text-center text-xs text-muted-foreground mt-8 max-w-lg mx-auto">
          {t("imageRequest.privacyNote")}
        </p>
      </div>

      {selectedProvider && <ProviderProfile provider={selectedProvider} onClose={() => setSelectedProvider(null)} />}
    </section>
  );
};

export default ImageServiceRequest;
