import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/authContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  CalendarIcon, Clock, Loader2, X, RefreshCw,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, isBefore, startOfDay, addDays } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  confirmed: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface Booking {
  id: string;
  booking_code: string;
  booking_date: string;
  time_slot: string;
  status: string;
  service_note: string;
  cancellation_reason: string;
  provider_name: string;
  service_type: string;
  service_profile_id: string;
  provider_user_id: string;
}

const BookingStatusTracker = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialog, setCancelDialog] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDialog, setRescheduleDialog] = useState<Booking | null>(null);
  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newSlot, setNewSlot] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const DEFAULT_SLOTS = [
    "08:00–09:00", "09:00–10:00", "10:00–11:00", "11:00–12:00",
    "12:00–13:00", "13:00–14:00", "14:00–15:00", "15:00–16:00",
    "16:00–17:00", "17:00–18:00", "18:00–19:00", "19:00–20:00",
  ];

  useEffect(() => {
    if (!user) return;
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (!data || (data as any[]).length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    // Get provider info
    const spIds = [...new Set((data as any[]).map((b: any) => b.service_profile_id))];
    const { data: sps } = await supabase.from("service_profiles").select("id, user_id, service_type").in("id", spIds);
    const spMap = new Map((sps as any[] || []).map((s: any) => [s.id, s]));

    const userIds = [...new Set((sps as any[] || []).map((s: any) => s.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.user_id, p]));

    const mapped: Booking[] = (data as any[]).map((b: any) => {
      const sp = spMap.get(b.service_profile_id);
      const profile = sp ? profileMap.get(sp.user_id) : null;
      return {
        id: b.id,
        booking_code: b.booking_code,
        booking_date: b.booking_date,
        time_slot: b.time_slot,
        status: b.status,
        service_note: b.service_note,
        cancellation_reason: b.cancellation_reason,
        provider_name: profile?.name || "Provider",
        service_type: sp?.service_type || "",
        service_profile_id: b.service_profile_id,
        provider_user_id: b.provider_user_id,
      };
    });
    setBookings(mapped);
    setLoading(false);
  };

  const handleCancel = async () => {
    if (!cancelDialog) return;
    setSaving(true);
    await supabase.from("bookings").update({
      status: "cancelled",
      cancellation_reason: cancelReason,
    } as any).eq("id", cancelDialog.id);
    setSaving(false);
    setCancelDialog(null);
    setCancelReason("");
    loadBookings();
  };

  const handleReschedule = async () => {
    if (!rescheduleDialog || !newDate || !newSlot) return;
    setSaving(true);
    await supabase.from("bookings").update({
      booking_date: format(newDate, "yyyy-MM-dd"),
      time_slot: newSlot,
      status: "pending",
    } as any).eq("id", rescheduleDialog.id);
    setSaving(false);
    setRescheduleDialog(null);
    setNewDate(undefined);
    setNewSlot(null);
    loadBookings();
  };

  // Load booked slots when reschedule date changes
  useEffect(() => {
    if (!newDate || !rescheduleDialog) return;
    const load = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("time_slot")
        .eq("service_profile_id", rescheduleDialog.service_profile_id)
        .eq("booking_date", format(newDate, "yyyy-MM-dd"))
        .in("status", ["pending", "confirmed"]);
      setBookedSlots((data as any[] || []).map((b: any) => b.time_slot));
      setNewSlot(null);
    };
    load();
  }, [newDate, rescheduleDialog]);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-8" />;

  if (bookings.length === 0) return (
    <div className="py-8 text-center text-muted-foreground">
      <p>No bookings yet. Browse providers and book a service!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div key={b.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{b.provider_name}</span>
                <span className="text-xs text-muted-foreground">• {b.service_type}</span>
                <Badge className={cn("text-xs", STATUS_STYLES[b.status])}>
                  {STATUS_LABELS[b.status]}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {b.booking_date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {b.time_slot}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground font-mono">ID: {b.booking_code.toUpperCase()}</p>
              {b.cancellation_reason && (
                <p className="mt-1 text-xs text-destructive">Reason: {b.cancellation_reason}</p>
              )}
            </div>
            {(b.status === "pending" || b.status === "confirmed") && (
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="outline" onClick={() => { setRescheduleDialog(b); setNewDate(undefined); setNewSlot(null); }}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Reschedule
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setCancelDialog(b)}>
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Status progress bar */}
          <div className="mt-3 flex items-center gap-1">
            {["pending", "confirmed", "completed"].map((step, i) => {
              const stepOrder = ["pending", "confirmed", "completed"];
              const currentIdx = stepOrder.indexOf(b.status);
              const active = b.status !== "cancelled" && i <= currentIdx;
              return (
                <div key={step} className="flex-1 flex flex-col items-center">
                  <div className={cn("h-1.5 w-full rounded-full", active ? (
                    step === "pending" ? "bg-warning" : step === "confirmed" ? "bg-primary" : "bg-success"
                  ) : "bg-muted")} />
                  <span className="text-[10px] mt-1 text-muted-foreground capitalize">{step}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Cancel Dialog */}
      <Dialog open={!!cancelDialog} onOpenChange={() => setCancelDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to cancel your booking with <strong>{cancelDialog?.provider_name}</strong>?
            </p>
            <div>
              <Label>Reason for cancellation</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please tell us why you're cancelling..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog(null)}>Keep Booking</Button>
            <Button variant="destructive" disabled={!cancelReason.trim() || saving} onClick={handleCancel}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleDialog} onOpenChange={() => setRescheduleDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start mt-1", !newDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newDate ? format(newDate, "PPP") : "Pick a new date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newDate}
                    onSelect={setNewDate}
                    disabled={(d) => isBefore(d, startOfDay(new Date())) || isBefore(addDays(new Date(), 30), d)}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            {newDate && (
              <div>
                <Label>New Time Slot</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {DEFAULT_SLOTS.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        disabled={isBooked}
                        onClick={() => setNewSlot(slot)}
                        className={cn(
                          "rounded-lg border px-2 py-1.5 text-xs font-medium transition-all",
                          isBooked && "cursor-not-allowed bg-muted text-muted-foreground line-through opacity-50",
                          !isBooked && newSlot !== slot && "border-border hover:border-primary",
                          newSlot === slot && "border-primary bg-primary text-primary-foreground"
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialog(null)}>Cancel</Button>
            <Button disabled={!newDate || !newSlot || saving} onClick={handleReschedule}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingStatusTracker;
