import { useState, useEffect, lazy, Suspense } from "react";
import ComplaintTracker from "@/components/ComplaintTracker";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_TYPES, SERVICE_ICONS, ServiceProvider, EMERGENCY_SERVICE_TYPES } from "@/lib/mockData";
import ServiceProviderCard from "@/components/ServiceProviderCard";
import ProviderProfile from "@/components/ProviderProfile";
import BookingStatusTracker from "@/components/BookingStatusTracker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, CheckCircle, Loader2, CalendarIcon, MapPin, List as ListIcon, Map as MapIcon, Navigation, LocateFixed, Mic, MicOff, Siren, ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGeolocation, getDistanceKm } from "@/hooks/useGeolocation";
import { Badge } from "@/components/ui/badge";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const ProviderMapView = lazy(() => import("@/components/ProviderMapView"));

const CustomerDashboard = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { position, loading: geoLoading, requestLocation, denied } = useGeolocation();

  const [profileDone, setProfileDone] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [area, setArea] = useState("");
  const [saving, setSaving] = useState(false);

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("distance");
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [emergencyMode, setEmergencyMode] = useState(false);
  const voice = useVoiceSearch();

  // Apply voice search results
  useEffect(() => {
    if (!voice.transcript) return;
    // Clean transcript: remove "near me" style phrases for search text
    let cleaned = voice.transcript;
    ["near me", "nearby", "near by", "around me", "मेरे पास", "पास में", "आस पास", "என் அருகில்", "அருகில்", "నా దగ్గర", "సమీపంలో"]
      .forEach((kw) => { cleaned = cleaned.replace(new RegExp(kw, "gi"), ""); });
    ["book a", "find", "show", "search for", "search", "book"]
      .forEach((kw) => { cleaned = cleaned.replace(new RegExp(`^${kw}\\s+`, "i"), ""); });
    cleaned = cleaned.trim();

    if (voice.matchedCategory) {
      setCategoryFilter(voice.matchedCategory);
      setSearch("");
    } else if (cleaned) {
      setSearch(cleaned);
      setCategoryFilter("all");
    }

    if (voice.wantsNearby) {
      setSortBy("distance");
      if (!position) requestLocation();
    }
  }, [voice.transcript, voice.matchedCategory, voice.wantsNearby]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }
    if (!user.aadhaarVerified) { navigate("/verify-aadhaar"); return; }
    setName(user.name);
    if (user.profileComplete) setProfileDone(true);
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadProviders = async () => {
      setLoadingProviders(true);
      const { data: serviceProfiles } = await supabase.from("service_profiles").select("*");
      if (!serviceProfiles || (serviceProfiles as any[]).length === 0) { setProviders([]); setLoadingProviders(false); return; }

      const userIds = (serviceProfiles as any[]).map((sp: any) => sp.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
      const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.user_id, p]));

      const spIds = (serviceProfiles as any[]).map((sp: any) => sp.id);
      const { data: allReviews } = await supabase.from("reviews").select("*").in("service_profile_id", spIds);
      const reviewMap = new Map<string, any[]>();
      (allReviews as any[] || []).forEach((r: any) => {
        const list = reviewMap.get(r.service_profile_id) || [];
        list.push(r);
        reviewMap.set(r.service_profile_id, list);
      });

      // Fetch trust scores
      const { data: trustScores } = await supabase.rpc("get_trust_scores", { provider_ids: spIds });
      const trustMap = new Map<string, any>();
      (trustScores as any[] || []).forEach((ts: any) => trustMap.set(ts.service_profile_id, ts));

      const mapped: ServiceProvider[] = (serviceProfiles as any[]).map((sp: any) => {
        const profile = profileMap.get(sp.user_id) as any;
        const reviews = reviewMap.get(sp.id) || [];
        const trust = trustMap.get(sp.id);
        return {
          id: sp.id, name: profile?.name || "Unknown", age: sp.age || 0, experience: sp.experience || 0,
          contact: profile?.contact || "", serviceType: sp.service_type, city: profile?.city || "", area: profile?.area || "",
          bio: sp.bio || "", photo: profile?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || "U")}&background=3b82f6&color=fff`,
          available: sp.available, verified: profile?.aadhaar_verified || false, rating: parseFloat(sp.rating) || 0, reviewCount: sp.review_count || 0,
          latitude: sp.latitude, longitude: sp.longitude,
          emergencyAvailable: sp.emergency_available || false,
          trustScore: trust?.trust_score ?? 0,
          trustData: trust ? { trust_score: trust.trust_score, completed_jobs: Number(trust.completed_jobs), positive_reviews: Number(trust.positive_reviews), complaints_count: Number(trust.complaints_count), cancellations: Number(trust.cancellations), average_rating: Number(trust.average_rating) } : undefined,
          reviews: reviews.map((r: any) => ({ id: r.id, customerName: "Customer", rating: r.rating, comment: r.comment || "", date: r.created_at?.slice(0, 10) || "" })),
        };
      });
      setProviders(mapped);
      setLoadingProviders(false);
    };
    if (profileDone || (user && user.profileComplete)) loadProviders();
  }, [profileDone, user]);

  if (authLoading || !user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("profiles").update({ name, contact, area, profile_complete: true } as any).eq("user_id", user.id);
    await refreshUser();
    setSaving(false);
    setProfileDone(true);
  };

  if (!profileDone && !user.profileComplete) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card animate-scale-in">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">{t("customerDashboard.completeProfile")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("customerDashboard.profileSubtitle")}</p>
          </div>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div><Label>{t("customerDashboard.fullName")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
            <div><Label>{t("customerDashboard.contactNumber")}</Label><Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t("customerDashboard.contactPlaceholder")} required /></div>
            <div><Label>{t("customerDashboard.area")}</Label><Input value={area} onChange={(e) => setArea(e.target.value)} placeholder={t("customerDashboard.areaPlaceholder")} required /></div>
            <Button type="submit" className="w-full" size="lg" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("customerDashboard.saveAndBrowse")}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate distances
  const withDistance = providers.map((p) => {
    if (position && p.latitude && p.longitude) {
      return { ...p, distance: getDistanceKm(position.latitude, position.longitude, p.latitude, p.longitude) };
    }
    return { ...p, distance: undefined };
  });

  // Filter
  let filtered = withDistance.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.serviceType.toLowerCase().includes(search.toLowerCase()) || p.area.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.serviceType === categoryFilter;
    const matchesRating = ratingFilter === "all" || p.rating >= parseFloat(ratingFilter);
    const matchesEmergency = !emergencyMode || (p.emergencyAvailable && p.available && EMERGENCY_SERVICE_TYPES.includes(p.serviceType) && (p.distance == null || p.distance <= 10));
    return matchesSearch && matchesCategory && matchesRating && matchesEmergency;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === "distance") {
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    }
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "reviews") return b.reviewCount - a.reviewCount;
    if (sortBy === "experience") return b.experience - a.experience;
    if (sortBy === "trust") return (b.trustScore ?? 0) - (a.trustScore ?? 0);
    return 0;
  });

  const nearbyProviders = filtered.filter((p) => p.distance != null && p.distance <= 5);
  const mapCenter: [number, number] = position ? [position.latitude, position.longitude] : [20.5937, 78.9629];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-success">
          <CheckCircle className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("customerDashboard.welcome", { name: user.name })}</h1>
          <p className="text-sm text-muted-foreground">{t("customerDashboard.subtitle")}</p>
        </div>
      </div>

      {/* Location status */}
      <div className="mb-4 flex items-center gap-2">
        {geoLoading ? (
          <Badge variant="outline" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> {t("location.detecting")}</Badge>
        ) : position ? (
          <Badge variant="outline" className="gap-1 border-success/30 bg-success/10 text-success"><LocateFixed className="h-3 w-3" /> {t("location.detected")}</Badge>
        ) : (
          <Button variant="outline" size="sm" onClick={requestLocation} className="gap-1">
            <MapPin className="h-3 w-3" /> {denied ? t("location.manualSelect") : t("location.enable")}
          </Button>
        )}
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="browse"><Search className="h-4 w-4 mr-1" /> {t("customerDashboard.browse")}</TabsTrigger>
          <TabsTrigger value="bookings"><CalendarIcon className="h-4 w-4 mr-1" /> {t("customerDashboard.bookings")}</TabsTrigger>
          <TabsTrigger value="complaints"><ShieldAlert className="h-4 w-4 mr-1" /> {t("complaint.tabTitle")}</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings"><BookingStatusTracker /></TabsContent>
        <TabsContent value="complaints"><ComplaintTracker /></TabsContent>

        <TabsContent value="browse">
          {/* Emergency Mode Toggle */}
          <div className={`mb-4 flex items-center justify-between rounded-xl border p-4 transition-colors ${emergencyMode ? "border-destructive/40 bg-destructive/5" : "border-border bg-card"}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${emergencyMode ? "bg-destructive/10" : "bg-muted"}`}>
                <Siren className={`h-5 w-5 ${emergencyMode ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold">{t("emergency.toggleTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("emergency.toggleDesc")}</p>
              </div>
            </div>
            <Button
              variant={emergencyMode ? "destructive" : "outline"}
              size="sm"
              onClick={() => {
                setEmergencyMode(!emergencyMode);
                if (!emergencyMode) {
                  setSortBy("distance");
                  if (!position) requestLocation();
                }
              }}
            >
              {emergencyMode ? t("emergency.disable") : t("emergency.enable")}
            </Button>
          </div>

          {/* Search & Filter bar */}
          <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t("customerDashboard.searchFilter")}</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("list")}>
                  <ListIcon className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === "map" ? "default" : "ghost"} size="sm" className="h-7 px-2" onClick={() => setViewMode("map")}>
                  <MapIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={voice.isListening ? t("voiceSearch.listening") : t("customerDashboard.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-10" />
                {voice.supported && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={voice.isListening ? voice.stopListening : voice.startListening}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-colors ${
                            voice.isListening
                              ? "bg-destructive/10 text-destructive animate-pulse"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          }`}
                          aria-label={voice.isListening ? t("voiceSearch.stop") : t("voiceSearch.start")}
                        >
                          {voice.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {voice.isListening ? t("voiceSearch.stop") : t("voiceSearch.start")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {voice.error && (
                  <p className="absolute -bottom-5 left-0 text-xs text-destructive">{t(voice.error)}</p>
                )}
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder={t("common.category")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("customerDashboard.allCategories")}</SelectItem>
                  {SERVICE_TYPES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger><SelectValue placeholder={t("common.rating")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("customerDashboard.allRatings")}</SelectItem>
                  <SelectItem value="4">{t("customerDashboard.fourStarAbove")}</SelectItem>
                  <SelectItem value="3">{t("customerDashboard.threeStarAbove")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue placeholder={t("common.sortBy")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="distance"><Navigation className="inline h-3 w-3 mr-1" />{t("customerDashboard.nearestFirst")}</SelectItem>
                  <SelectItem value="rating">{t("customerDashboard.highestRating")}</SelectItem>
                  <SelectItem value="reviews">{t("customerDashboard.mostReviews")}</SelectItem>
                  <SelectItem value="experience">{t("customerDashboard.mostExperience")}</SelectItem>
                  <SelectItem value="trust">{t("trustScore.sortByTrust")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingProviders ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : viewMode === "map" ? (
            <Suspense fallback={<div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
              <ProviderMapView providers={filtered} center={mapCenter} />
            </Suspense>
          ) : (
            <>
              {/* Emergency Providers section */}
              {emergencyMode && filtered.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <Siren className="h-5 w-5 text-destructive" />
                    <h2 className="text-lg font-semibold">{t("emergency.sectionTitle")}</h2>
                    <Badge variant="outline" className="text-xs border-destructive/30 bg-destructive/10 text-destructive">{t("emergency.priority")}</Badge>
                  </div>
                </div>
              )}

              {/* Near You section */}
              {!emergencyMode && nearbyProviders.length > 0 && (
                <div className="mb-6">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">{t("customerDashboard.nearYou")}</h2>
                    <Badge variant="secondary" className="text-xs">{t("customerDashboard.within5km")}</Badge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {nearbyProviders.slice(0, 4).map((p) => (
                      <ServiceProviderCard key={p.id} provider={p} onViewProfile={setSelectedProvider} />
                    ))}
                  </div>
                </div>
              )}

              <p className="mb-4 text-sm text-muted-foreground">{t("customerDashboard.providersFound", { count: filtered.length })}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((p) => (<ServiceProviderCard key={p.id} provider={p} onViewProfile={setSelectedProvider} emergencyMode={emergencyMode} />))}
              </div>
              {filtered.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  <p className="text-lg">{emergencyMode ? t("emergency.noProviders") : t("customerDashboard.noProviders")}</p>
                  <p className="text-sm">{emergencyMode ? t("emergency.noProvidersDesc") : t("customerDashboard.noProvidersDesc")}</p>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {selectedProvider && <ProviderProfile provider={selectedProvider} onClose={() => setSelectedProvider(null)} />}
    </div>
  );
};

export default CustomerDashboard;
