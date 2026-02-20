import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/authContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/30",
  confirmed: "bg-primary/10 text-primary border-primary/30",
  completed: "bg-success/10 text-success border-success/30",
  cancelled: "bg-destructive/10 text-destructive border-destructive/30",
};

interface Booking {
  id: string;
  booking_code: string;
  booking_date: string;
  time_slot: string;
  status: string;
  service_note: string;
  customer_name: string;
}

const ProviderBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

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
      .eq("provider_user_id", user.id)
      .order("booking_date", { ascending: true });

    if (!data || (data as any[]).length === 0) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const customerIds = [...new Set((data as any[]).map((b: any) => b.customer_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", customerIds);
    const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.user_id, p]));

    const mapped: Booking[] = (data as any[]).map((b: any) => ({
      id: b.id,
      booking_code: b.booking_code,
      booking_date: b.booking_date,
      time_slot: b.time_slot,
      status: b.status,
      service_note: b.service_note,
      customer_name: profileMap.get(b.customer_id)?.name || "Customer",
    }));
    setBookings(mapped);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("bookings").update({ status } as any).eq("id", id);
    loadBookings();
  };

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-8" />;

  if (bookings.length === 0) return (
    <p className="py-8 text-center text-muted-foreground">No bookings yet. Your bookings will appear here once customers book your services.</p>
  );

  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <div key={b.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{b.customer_name}</span>
                <Badge className={cn("text-xs", STATUS_STYLES[b.status])}>{b.status}</Badge>
              </div>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {b.booking_date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {b.time_slot}</span>
              </div>
              {b.service_note && <p className="mt-1 text-xs text-muted-foreground">{b.service_note}</p>}
              <p className="mt-1 text-xs text-muted-foreground font-mono">ID: {b.booking_code.toUpperCase()}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              {b.status === "pending" && (
                <>
                  <Button size="sm" variant="outline" className="text-success border-success/30" onClick={() => updateStatus(b.id, "confirmed")}>
                    <Check className="h-3 w-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(b.id, "cancelled")}>
                    <X className="h-3 w-3 mr-1" /> Decline
                  </Button>
                </>
              )}
              {b.status === "confirmed" && (
                <Button size="sm" variant="outline" className="text-success border-success/30" onClick={() => updateStatus(b.id, "completed")}>
                  <Check className="h-3 w-3 mr-1" /> Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProviderBookings;
