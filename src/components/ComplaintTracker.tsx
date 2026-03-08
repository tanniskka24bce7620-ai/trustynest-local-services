import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CalendarIcon, Clock, Loader2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STATUS_STYLES: Record<string, string> = {
  pending_review: "bg-warning/10 text-warning border-warning/30",
  under_investigation: "bg-primary/10 text-primary border-primary/30",
  resolved: "bg-success/10 text-success border-success/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending Review",
  under_investigation: "Under Investigation",
  resolved: "Resolved",
  rejected: "Rejected",
};

interface Complaint {
  id: string;
  complaint_code: string;
  complaint_type: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  provider_name: string;
  service_type: string;
  resolution_action: string | null;
  resolution_notes: string | null;
  evidence_urls: string[];
}

const ComplaintTracker = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Complaint | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("complaints" as any)
        .select("*")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (!data || (data as any[]).length === 0) {
        setComplaints([]);
        setLoading(false);
        return;
      }

      const spIds = [...new Set((data as any[]).map((c: any) => c.service_profile_id))];
      const { data: sps } = await supabase.from("service_profiles").select("id, user_id, service_type").in("id", spIds);
      const spMap = new Map((sps as any[] || []).map((s: any) => [s.id, s]));
      const userIds = [...new Set((sps as any[] || []).map((s: any) => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
      const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.user_id, p]));

      const mapped: Complaint[] = (data as any[]).map((c: any) => {
        const sp = spMap.get(c.service_profile_id);
        const profile = sp ? profileMap.get(sp.user_id) : null;
        return {
          id: c.id,
          complaint_code: c.complaint_code,
          complaint_type: c.complaint_type,
          description: c.description,
          severity: c.severity,
          status: c.status,
          created_at: c.created_at,
          provider_name: profile?.name || "Provider",
          service_type: sp?.service_type || "",
          resolution_action: c.resolution_action,
          resolution_notes: c.resolution_notes,
          evidence_urls: c.evidence_urls || [],
        };
      });
      setComplaints(mapped);
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto my-8" />;

  if (complaints.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>{t("complaint.noComplaints")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {complaints.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-border bg-card p-4 shadow-soft cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => setSelected(c)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{c.provider_name}</span>
                  <span className="text-xs text-muted-foreground">• {c.service_type}</span>
                  <Badge className={`text-xs ${STATUS_STYLES[c.status]}`}>{STATUS_LABELS[c.status] || c.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.complaint_type}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {c.created_at?.slice(0, 10)}</span>
                  <span className="font-mono">ID: {c.complaint_code.toUpperCase()}</span>
                </div>
                <Badge className={`mt-1 text-xs capitalize ${
                  c.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/30" :
                  c.severity === "medium" ? "bg-warning/10 text-warning border-warning/30" :
                  "bg-muted text-muted-foreground"
                }`}>{c.severity}</Badge>
              </div>
            </div>
            {c.resolution_notes && (
              <div className="mt-3 rounded-lg bg-success/5 border border-success/20 p-3">
                <p className="text-xs font-medium text-success">{t("complaint.resolution")}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.resolution_notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              {t("complaint.details")}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("complaint.complaintId")}</span><span className="font-mono font-medium">{selected.complaint_code.toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.provider")}</span><span className="font-medium">{selected.provider_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("complaint.type")}</span><span>{selected.complaint_type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("complaint.severity")}</span><Badge className={`text-xs capitalize ${
                  selected.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/30" :
                  selected.severity === "medium" ? "bg-warning/10 text-warning border-warning/30" :
                  "bg-muted text-muted-foreground"
                }`}>{selected.severity}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("booking.status")}</span><Badge className={`text-xs ${STATUS_STYLES[selected.status]}`}>{STATUS_LABELS[selected.status]}</Badge></div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">{t("complaint.description")}</p>
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              </div>

              {selected.evidence_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">{t("complaint.evidence")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selected.evidence_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-border overflow-hidden hover:border-primary/30 transition-colors">
                        {url.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                          <img src={url} alt={`Evidence ${i + 1}`} className="h-20 w-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-20 bg-muted text-xs text-muted-foreground gap-1">
                            <ExternalLink className="h-3 w-3" /> File {i + 1}
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selected.resolution_notes && (
                <div className="rounded-lg bg-success/5 border border-success/20 p-3">
                  <p className="text-xs font-medium text-success">{t("complaint.resolution")}</p>
                  {selected.resolution_action && <p className="text-sm font-medium mt-1">{selected.resolution_action}</p>}
                  <p className="text-sm text-muted-foreground mt-1">{selected.resolution_notes}</p>
                </div>
              )}

              <Button variant="outline" className="w-full" onClick={() => setSelected(null)}>{t("common.close")}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ComplaintTracker;
