import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_TYPES, SERVICE_ICONS, ServiceProvider } from "@/lib/mockData";
import ServiceProviderCard from "@/components/ServiceProviderCard";
import ProviderProfile from "@/components/ProviderProfile";
import BookingStatusTracker from "@/components/BookingStatusTracker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, CheckCircle, Loader2, CalendarIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CustomerDashboard = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
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
  const [sortBy, setSortBy] = useState<string>("rating");
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);

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

      const mapped: ServiceProvider[] = (serviceProfiles as any[]).map((sp: any) => {
        const profile = profileMap.get(sp.user_id) as any;
        const reviews = reviewMap.get(sp.id) || [];
        return {
          id: sp.id, name: profile?.name || "Unknown", age: sp.age || 0, experience: sp.experience || 0,
          contact: profile?.contact || "", serviceType: sp.service_type, city: profile?.city || "", area: profile?.area || "",
          bio: sp.bio || "", photo: profile?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || "U")}&background=3b82f6&color=fff`,
          available: sp.available, verified: profile?.aadhaar_verified || false, rating: parseFloat(sp.rating) || 0, reviewCount: sp.review_count || 0,
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

  let filtered = providers.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.serviceType.toLowerCase().includes(search.toLowerCase()) || p.area.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || p.serviceType === categoryFilter;
    const matchesRating = ratingFilter === "all" || p.rating >= parseFloat(ratingFilter);
    return matchesSearch && matchesCategory && matchesRating;
  });

  filtered.sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "reviews") return b.reviewCount - a.reviewCount;
    if (sortBy === "experience") return b.experience - a.experience;
    return 0;
  });

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

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="browse"><Search className="h-4 w-4 mr-1" /> {t("customerDashboard.browse")}</TabsTrigger>
          <TabsTrigger value="bookings"><CalendarIcon className="h-4 w-4 mr-1" /> {t("customerDashboard.bookings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings"><BookingStatusTracker /></TabsContent>

        <TabsContent value="browse">
          <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t("customerDashboard.searchFilter")}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t("customerDashboard.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                  <SelectItem value="rating">{t("customerDashboard.highestRating")}</SelectItem>
                  <SelectItem value="reviews">{t("customerDashboard.mostReviews")}</SelectItem>
                  <SelectItem value="experience">{t("customerDashboard.mostExperience")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingProviders ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{t("customerDashboard.providersFound", { count: filtered.length })}</p>
              <div className="grid gap-4 md:grid-cols-2">
                {filtered.map((p) => (<ServiceProviderCard key={p.id} provider={p} onViewProfile={setSelectedProvider} />))}
              </div>
              {filtered.length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  <p className="text-lg">{t("customerDashboard.noProviders")}</p>
                  <p className="text-sm">{t("customerDashboard.noProvidersDesc")}</p>
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
