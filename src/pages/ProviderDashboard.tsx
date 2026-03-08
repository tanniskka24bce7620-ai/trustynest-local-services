import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_TYPES, SERVICE_ICONS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import ProviderBookings from "@/components/ProviderBookings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Edit2, Save, Loader2, CalendarIcon, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotificationBell from "@/components/NotificationBell";

const ProviderDashboard = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileSaved, setProfileSaved] = useState(false);
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceProfileId, setServiceProfileId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: "", age: "", experience: "", contact: "", serviceType: "", city: "", area: "", bio: "", available: true,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }
    if (!user.aadhaarVerified) { navigate("/verify-aadhaar"); return; }

    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      const { data: sp } = await supabase.from("service_profiles").select("*").eq("user_id", user.id).maybeSingle();
      const p = profile as any; const s = sp as any;
      setForm({
        name: p?.name || user.name || "", age: s?.age?.toString() || "", experience: s?.experience?.toString() || "",
        contact: p?.contact || "", serviceType: s?.service_type || "", city: p?.city || "", area: p?.area || "",
        bio: s?.bio || "", available: s?.available ?? true,
      });
      if (p?.photo_url) setPhotoUrl(p.photo_url);
      if (s) { setServiceProfileId(s.id); setProfileSaved(true); setEditing(false); }
    };
    load();
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return null;

  const handleChange = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB max

    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Add cache-bust to force refresh
      const url = `${publicUrl}?t=${Date.now()}`;
      setPhotoUrl(url);

      // Update profile
      await supabase.from("profiles").update({ photo_url: url } as any).eq("user_id", user.id);
    }
    setUploading(false);
  };

  const avatarSrc = photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || "P")}&background=3b82f6&color=fff`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from("profiles").update({ name: form.name, contact: form.contact, city: form.city, area: form.area, profile_complete: true } as any).eq("user_id", user.id);
    if (serviceProfileId) {
      await supabase.from("service_profiles").update({ service_type: form.serviceType, age: parseInt(form.age) || null, experience: parseInt(form.experience) || 0, bio: form.bio, available: form.available } as any).eq("id", serviceProfileId);
    } else {
      const { data } = await supabase.from("service_profiles").insert({ user_id: user.id, service_type: form.serviceType, age: parseInt(form.age) || null, experience: parseInt(form.experience) || 0, bio: form.bio, available: form.available } as any).select().maybeSingle();
      if (data) setServiceProfileId((data as any).id);
    }
    await refreshUser();
    setSaving(false);
    setProfileSaved(true);
    setEditing(false);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-hero">
            <span className="text-lg font-bold text-primary-foreground">{form.serviceType ? SERVICE_ICONS[form.serviceType] || "👷" : "👷"}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("providerDashboard.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("providerDashboard.subtitle")}</p>
          </div>
        </div>
        <NotificationBell />
      </div>

      {user.aadhaarVerified && (
        <Badge variant="outline" className="mb-4 gap-1 border-success/30 bg-success/10 text-success">
          <CheckCircle className="h-3 w-3" /> {t("aadhaar.verified")}
        </Badge>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profile"><Edit2 className="h-4 w-4 mr-1" /> {t("providerDashboard.profile")}</TabsTrigger>
          <TabsTrigger value="bookings"><CalendarIcon className="h-4 w-4 mr-1" /> {t("providerDashboard.bookings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
            {profileSaved && !editing && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{t("providerDashboard.profileLive")}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="mr-1 h-4 w-4" /> {t("providerDashboard.edit")}
                </Button>
              </div>
            )}

            {profileSaved && !editing && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <img
                      src={avatarSrc}
                      alt={form.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <Camera className="h-5 w-5 text-white" />
                      )}
                    </button>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{form.name}</h2>
                    <p className="text-sm text-muted-foreground">{form.serviceType}</p>
                    <p className="text-sm text-muted-foreground">{form.area}, {form.city}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted p-3"><p className="text-lg font-bold">{form.experience}</p><p className="text-xs text-muted-foreground">{t("providerDashboard.yearsExp")}</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-lg font-bold flex items-center justify-center gap-1">0 <Star className="h-4 w-4 fill-warning text-warning" /></p><p className="text-xs text-muted-foreground">{t("providerDashboard.rating")}</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-lg font-bold">0</p><p className="text-xs text-muted-foreground">{t("providerDashboard.reviews")}</p></div>
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm">{form.bio}</div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium">{t("providerDashboard.available")}</span>
                  <Switch checked={form.available} onCheckedChange={async (v) => { handleChange("available", v); if (serviceProfileId) await supabase.from("service_profiles").update({ available: v } as any).eq("id", serviceProfileId); }} />
                </div>
              </div>
            )}

            {editing && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo upload */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <img
                      src={avatarSrc}
                      alt={form.name}
                      className="h-24 w-24 rounded-2xl object-cover border-2 border-border"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      ) : (
                        <>
                          <Camera className="h-6 w-6 text-white" />
                          <span className="mt-1 text-[10px] text-white font-medium">{t("providerDashboard.uploadPhoto")}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("providerDashboard.photoHint")}</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div><Label>{t("providerDashboard.fullName")}</Label><Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} required /></div>
                  <div><Label>{t("providerDashboard.age")}</Label><Input type="number" value={form.age} onChange={(e) => handleChange("age", e.target.value)} required /></div>
                  <div><Label>{t("providerDashboard.experience")}</Label><Input type="number" value={form.experience} onChange={(e) => handleChange("experience", e.target.value)} required /></div>
                  <div><Label>{t("providerDashboard.contactNumber")}</Label><Input value={form.contact} onChange={(e) => handleChange("contact", e.target.value)} placeholder={t("providerDashboard.contactPlaceholder")} required /></div>
                  <div>
                    <Label>{t("providerDashboard.serviceType")}</Label>
                    <Select value={form.serviceType} onValueChange={(v) => handleChange("serviceType", v)}>
                      <SelectTrigger><SelectValue placeholder={t("providerDashboard.selectService")} /></SelectTrigger>
                      <SelectContent>{SERVICE_TYPES.map((s) => (<SelectItem key={s} value={s}>{SERVICE_ICONS[s]} {s}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t("providerDashboard.city")}</Label><Input value={form.city} onChange={(e) => handleChange("city", e.target.value)} required /></div>
                  <div className="sm:col-span-2"><Label>{t("providerDashboard.area")}</Label><Input value={form.area} onChange={(e) => handleChange("area", e.target.value)} placeholder={t("providerDashboard.areaPlaceholder")} required /></div>
                  <div className="sm:col-span-2"><Label>{t("providerDashboard.bio")}</Label><Textarea value={form.bio} onChange={(e) => handleChange("bio", e.target.value)} placeholder={t("providerDashboard.bioPlaceholder")} required /></div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <span className="text-sm font-medium">{t("providerDashboard.available")}</span>
                  <Switch checked={form.available} onCheckedChange={(v) => handleChange("available", v)} />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t("providerDashboard.saveProfile")}
                </Button>
              </form>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookings"><ProviderBookings /></TabsContent>
      </Tabs>

      {/* Hidden file input shared between edit and view modes */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handlePhotoUpload}
      />
    </div>
  );
};

export default ProviderDashboard;
