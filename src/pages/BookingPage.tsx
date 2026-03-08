import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_ICONS } from "@/lib/mockData";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, CheckCircle, ArrowLeft, CalendarIcon, Clock, Loader2, PartyPopper, Siren } from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

const DEFAULT_SLOTS = [
  "08:00–09:00","09:00–10:00","10:00–11:00","11:00–12:00",
  "12:00–13:00","13:00–14:00","14:00–15:00","15:00–16:00",
  "16:00–17:00","17:00–18:00","18:00–19:00","19:00–20:00",
];

function generateSlots(startHour: number, endHour: number, duration: number) {
  const slots: string[] = [];
  for (let h = startHour; h + duration / 60 <= endHour; h += duration / 60) {
    const endH = h + duration / 60;
    const fmt = (n: number) => `${String(Math.floor(n)).padStart(2, "0")}:${n % 1 ? "30" : "00"}`;
    slots.push(`${fmt(h)}–${fmt(endH)}`);
  }
  return slots.length ? slots : DEFAULT_SLOTS;
}

const BookingPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const spId = searchParams.get("sp");
  const isEmergency = searchParams.get("emergency") === "true";

  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_SLOTS);
  const [dayAvailable, setDayAvailable] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<{ code: string; id: string } | null>(null);

  useEffect(() => {
    if (!spId) return;
    const load = async () => {
      const { data: sp } = await supabase.from("service_profiles").select("*").eq("id", spId).maybeSingle();
      if (!sp) { setLoading(false); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", (sp as any).user_id).maybeSingle();
      setProvider({ ...(sp as any), profile: profile as any });
      setLoading(false);
    };
    load();
  }, [spId]);

  useEffect(() => {
    if (!date || !spId) return;
    const loadSlots = async () => {
      const dateStr = format(date, "yyyy-MM-dd");
      const { data: bookings } = await supabase.from("bookings").select("time_slot").eq("service_profile_id", spId).eq("booking_date", dateStr).in("status", ["pending", "confirmed"]);
      setBookedSlots((bookings as any[] || []).map((b: any) => b.time_slot));
      const dow = date.getDay();
      const { data: avail } = await supabase.from("provider_availability").select("*").eq("service_profile_id", spId).eq("day_of_week", dow).maybeSingle();
      if (avail) {
        const a = avail as any;
        if (!a.is_available) { setDayAvailable(false); setAvailableSlots([]); }
        else { setDayAvailable(true); setAvailableSlots(generateSlots(a.start_hour, a.end_hour, a.slot_duration_minutes)); }
      } else { setDayAvailable(true); setAvailableSlots(DEFAULT_SLOTS); }
      setSelectedSlot(null);
    };
    loadSlots();
  }, [date, spId]);

  const handleBook = async () => {
    if (!user || !date || !selectedSlot || !spId || !provider) return;
    setSubmitting(true);
    const bookingData: any = {
      customer_id: user.id, service_profile_id: spId, provider_user_id: provider.user_id,
      booking_date: format(date, "yyyy-MM-dd"), time_slot: selectedSlot, service_note: note,
    };
    if (isEmergency) {
      bookingData.is_emergency = true;
      bookingData.emergency_status = "emergency_pending";
      bookingData.emergency_requested_at = new Date().toISOString();
    }
    const { data, error } = await supabase.from("bookings").insert(bookingData).select().maybeSingle();
    if (!error && data) setConfirmation({ code: (data as any).booking_code, id: (data as any).id });
    setSubmitting(false);
  };

  if (!user) return null;
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!provider) return (
    <div className="container mx-auto px-4 py-12 text-center">
      <p className="text-muted-foreground">{t("booking.providerNotFound")}</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>{t("booking.goBack")}</Button>
    </div>
  );

  if (confirmation) {
    return (
      <div className="container mx-auto max-w-md px-4 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card animate-scale-in">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10"><PartyPopper className="h-8 w-8 text-success" /></div>
          <h2 className="text-2xl font-bold">{t("booking.confirmed")}</h2>
          <p className="mt-2 text-muted-foreground">{t("booking.confirmedDesc")}</p>
          <div className="mt-6 space-y-3 rounded-lg bg-muted p-4 text-left text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.bookingId")}</span><span className="font-mono font-semibold uppercase">{confirmation.code}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.provider")}</span><span className="font-medium">{provider.profile?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.service")}</span><span>{provider.service_type}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.date")}</span><span>{date ? format(date, "PPP") : ""}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.time")}</span><span>{selectedSlot}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.status")}</span>
              {isEmergency ? (
                <Badge className="bg-destructive/10 text-destructive border-destructive/30 gap-1"><Siren className="h-3 w-3" /> {t("emergency.pending")}</Badge>
              ) : (
                <Badge className="bg-warning/10 text-warning border-warning/30">{t("booking.pending")}</Badge>
              )}
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button className="flex-1" onClick={() => navigate("/customer-dashboard")}>{t("booking.myBookings")}</Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate("/customer-dashboard")}>{t("booking.browseMore")}</Button>
          </div>
        </div>
      </div>
    );
  }

  const freeSlots = availableSlots.filter((s) => !bookedSlots.includes(s));
  const fullyBooked = dayAvailable && date && freeSlots.length === 0;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> {t("booking.back")}
      </Button>

      <h1 className="text-2xl font-bold mb-6">{t("booking.title")}</h1>

      <div className="rounded-xl border border-border bg-card p-5 shadow-soft mb-6">
        <div className="flex gap-4">
          <img src={provider.profile?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.profile?.name || "P")}&background=3b82f6&color=fff`} alt={provider.profile?.name} className="h-16 w-16 rounded-xl object-cover" />
          <div>
            <h3 className="font-semibold text-lg">{provider.profile?.name}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">{SERVICE_ICONS[provider.service_type]} {provider.service_type}</p>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {provider.profile?.area}, {provider.profile?.city}</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /> {parseFloat(provider.rating) || 0}</span>
            </div>
            {provider.profile?.aadhaar_verified && (
              <Badge variant="outline" className="mt-1 gap-1 border-success/30 bg-success/10 text-success text-xs"><CheckCircle className="h-3 w-3" /> {t("providerCard.verified")}</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3"><CalendarIcon className="h-4 w-4 text-primary" /><h3 className="font-semibold">{t("booking.selectDate")}</h3></div>
          <Calendar mode="single" selected={date} onSelect={setDate} disabled={(d) => isBefore(d, startOfDay(new Date())) || isBefore(addDays(new Date(), 30), d)} className="pointer-events-auto rounded-md border" />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-3"><Clock className="h-4 w-4 text-primary" /><h3 className="font-semibold">{t("booking.selectTime")}</h3></div>
          {!date && <p className="text-sm text-muted-foreground py-8 text-center">{t("booking.selectDateFirst")}</p>}
          {date && !dayAvailable && <div className="py-8 text-center"><p className="text-sm text-muted-foreground">{t("booking.unavailableDay", { day: format(date, "EEEE") })}</p></div>}
          {fullyBooked && <div className="py-8 text-center"><Badge variant="destructive">{t("booking.fullyBooked")}</Badge><p className="mt-2 text-sm text-muted-foreground">{t("booking.noSlots")}</p></div>}
          {date && dayAvailable && !fullyBooked && (
            <div className="grid grid-cols-2 gap-2">
              {availableSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isSelected = selectedSlot === slot;
                return (
                  <button key={slot} disabled={isBooked} onClick={() => setSelectedSlot(slot)} className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                    isBooked && "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-50",
                    !isBooked && !isSelected && "border-border bg-card hover:border-primary hover:bg-primary/5",
                    isSelected && "border-primary bg-primary text-primary-foreground"
                  )}>
                    {slot}
                    {isBooked && <span className="block text-xs">{t("booking.booked")}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
        <Label htmlFor="note">{t("booking.serviceNote")}</Label>
        <Textarea id="note" placeholder={t("booking.notePlaceholder")} value={note} onChange={(e) => setNote(e.target.value)} className="mt-2" maxLength={500} />
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">{date && selectedSlot && <span>{format(date, "PPP")} • {selectedSlot}</span>}</div>
          <Button size="lg" disabled={!date || !selectedSlot || submitting} onClick={handleBook}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("booking.confirmBooking")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
