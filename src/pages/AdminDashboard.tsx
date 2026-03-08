import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/authContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Search, Loader2, Eye, ExternalLink, AlertTriangle, Shield } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface TrustProvider {
  service_profile_id: string;
  user_id: string;
  provider_name: string;
  service_type: string;
  trust_score: number;
  completed_jobs: number;
  positive_reviews: number;
  complaints_count: number;
  cancellations: number;
  average_rating: number;
}

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

const RESOLUTION_ACTIONS = [
  "Issue Warning to Provider",
  "Partial Refund",
  "Full Refund",
  "Suspend Provider Account",
  "Dismiss Complaint",
];

interface Complaint {
  id: string;
  complaint_code: string;
  booking_id: string | null;
  customer_id: string;
  provider_user_id: string;
  service_profile_id: string;
  complaint_type: string;
  description: string;
  severity: string;
  status: string;
  evidence_urls: string[];
  resolution_action: string | null;
  resolution_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  customer_name?: string;
  provider_name?: string;
  service_type?: string;
}

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [resolutionAction, setResolutionAction] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [flaggedProviders, setFlaggedProviders] = useState<string[]>([]);
  const [trustProviders, setTrustProviders] = useState<TrustProvider[]>([]);
  const [trustLoading, setTrustLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/"); return; }
    checkAdmin();
  }, [user, authLoading]);

  const checkAdmin = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin" as any);
    if (!data || (data as any[]).length === 0) {
      navigate("/");
      return;
    }
    setIsAdmin(true);
    loadComplaints();
    loadTrustData();
  };

  const loadTrustData = async () => {
    setTrustLoading(true);
    const { data: scores } = await supabase.rpc("get_trust_scores");
    if (!scores || (scores as any[]).length === 0) { setTrustProviders([]); setTrustLoading(false); return; }
    const userIds = [...new Set((scores as any[]).map((s: any) => s.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.user_id, p.name]));
    const { data: sps } = await supabase.from("service_profiles").select("id, service_type, user_id");
    const spMap = new Map((sps as any[] || []).map((s: any) => [s.id, s]));
    const mapped: TrustProvider[] = (scores as any[]).map((s: any) => {
      const sp = spMap.get(s.service_profile_id);
      return {
        ...s,
        provider_name: profileMap.get(s.user_id) || "Unknown",
        service_type: sp?.service_type || "",
        completed_jobs: Number(s.completed_jobs),
        positive_reviews: Number(s.positive_reviews),
        complaints_count: Number(s.complaints_count),
        cancellations: Number(s.cancellations),
        average_rating: Number(s.average_rating),
      };
    });
    mapped.sort((a, b) => a.trust_score - b.trust_score);
    setTrustProviders(mapped);
    setTrustLoading(false);
  };

  const loadComplaints = async () => {
    setLoading(true);
    const { data } = await supabase.from("complaints" as any).select("*").order("created_at", { ascending: false });
    if (!data || (data as any[]).length === 0) { setComplaints([]); setLoading(false); return; }

    // Get all user IDs for lookups
    const customerIds = [...new Set((data as any[]).map((c: any) => c.customer_id))];
    const providerIds = [...new Set((data as any[]).map((c: any) => c.provider_user_id))];
    const allUserIds = [...new Set([...customerIds, ...providerIds])];
    const spIds = [...new Set((data as any[]).map((c: any) => c.service_profile_id))];

    const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", allUserIds);
    const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.user_id, p.name]));

    const { data: sps } = await supabase.from("service_profiles").select("id, service_type").in("id", spIds);
    const spMap = new Map((sps as any[] || []).map((s: any) => [s.id, s.service_type]));

    const mapped: Complaint[] = (data as any[]).map((c: any) => ({
      ...c,
      evidence_urls: c.evidence_urls || [],
      customer_name: profileMap.get(c.customer_id) || "Customer",
      provider_name: profileMap.get(c.provider_user_id) || "Provider",
      service_type: spMap.get(c.service_profile_id) || "",
    }));
    setComplaints(mapped);

    // Check flagged providers (3+ high severity in current month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const highComplaints = mapped.filter((c) => c.severity === "high" && c.created_at.startsWith(currentMonth));
    const providerCounts = new Map<string, number>();
    highComplaints.forEach((c) => {
      providerCounts.set(c.provider_user_id, (providerCounts.get(c.provider_user_id) || 0) + 1);
    });
    setFlaggedProviders(Array.from(providerCounts.entries()).filter(([, count]) => count >= 3).map(([id]) => id));

    setLoading(false);
  };

  const openDetail = (c: Complaint) => {
    setSelected(c);
    setNewStatus(c.status);
    setResolutionAction(c.resolution_action || "");
    setResolutionNotes(c.resolution_notes || "");
    setAdminNotes(c.admin_notes || "");
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    const updateData: any = { status: newStatus, admin_notes: adminNotes };
    if (newStatus === "resolved") {
      updateData.resolution_action = resolutionAction;
      updateData.resolution_notes = resolutionNotes;
    }
    const { error } = await supabase.from("complaints" as any).update(updateData).eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error updating complaint", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Complaint updated successfully" });
      setSelected(null);
      loadComplaints();
    }
  };

  if (authLoading || !isAdmin) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const filtered = complaints.filter((c) => {
    const matchesSearch = c.complaint_code.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.provider_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.complaint_type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
          <ShieldAlert className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t("admin.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
        </div>
      </div>

      <Tabs defaultValue="complaints" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="complaints"><ShieldAlert className="h-4 w-4 mr-1" /> Complaints</TabsTrigger>
          <TabsTrigger value="trust"><Shield className="h-4 w-4 mr-1" /> {t("trustScore.trustMonitoring")}</TabsTrigger>
        </TabsList>

        <TabsContent value="complaints">
      {flaggedProviders.length > 0 && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="font-semibold text-destructive">{t("admin.flaggedAlert")}</span>
          </div>
          <p className="text-sm text-muted-foreground">{t("admin.flaggedDesc", { count: flaggedProviders.length })}</p>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("admin.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.allStatuses")}</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: t("admin.total"), count: complaints.length, style: "bg-card" },
          { label: STATUS_LABELS.pending_review, count: complaints.filter((c) => c.status === "pending_review").length, style: "bg-warning/5 border-warning/20" },
          { label: STATUS_LABELS.under_investigation, count: complaints.filter((c) => c.status === "under_investigation").length, style: "bg-primary/5 border-primary/20" },
          { label: STATUS_LABELS.resolved, count: complaints.filter((c) => c.status === "resolved").length, style: "bg-success/5 border-success/20" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.style}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-8" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("complaint.complaintId")}</TableHead>
                  <TableHead>{t("admin.customer")}</TableHead>
                  <TableHead>{t("booking.provider")}</TableHead>
                  <TableHead>{t("complaint.type")}</TableHead>
                  <TableHead>{t("complaint.severity")}</TableHead>
                  <TableHead>{t("booking.status")}</TableHead>
                  <TableHead>{t("booking.date")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t("admin.noComplaints")}</TableCell></TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className={flaggedProviders.includes(c.provider_user_id) ? "bg-destructive/5" : ""}>
                      <TableCell className="font-mono text-xs">{c.complaint_code.toUpperCase()}</TableCell>
                      <TableCell className="text-sm">{c.customer_name}</TableCell>
                      <TableCell className="text-sm">
                        {c.provider_name}
                        {flaggedProviders.includes(c.provider_user_id) && (
                          <Badge className="ml-1 text-[10px] bg-destructive/10 text-destructive border-destructive/30">⚠ Flagged</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{c.complaint_type}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs capitalize ${
                          c.severity === "high" ? "bg-destructive/10 text-destructive border-destructive/30" :
                          c.severity === "medium" ? "bg-warning/10 text-warning border-warning/30" :
                          "bg-muted text-muted-foreground"
                        }`}>{c.severity}</Badge>
                      </TableCell>
                      <TableCell><Badge className={`text-xs ${STATUS_STYLES[c.status]}`}>{STATUS_LABELS[c.status]}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.created_at?.slice(0, 10)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => openDetail(c)}><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Detail / Update Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              {t("complaint.details")} — {selected?.complaint_code.toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">{t("admin.customer")}</p>
                  <p className="font-medium">{selected.customer_name}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">{t("booking.provider")}</p>
                  <p className="font-medium">{selected.provider_name}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">{t("complaint.type")}</p>
                  <p className="font-medium">{selected.complaint_type}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">{t("booking.service")}</p>
                  <p className="font-medium">{selected.service_type}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">{t("complaint.description")}</p>
                <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">{selected.description}</p>
              </div>

              {/* Evidence */}
              {selected.evidence_urls.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">{t("complaint.evidence")}</p>
                  <div className="grid grid-cols-4 gap-2">
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

              {/* Admin Actions */}
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="font-semibold">{t("admin.actions")}</h3>

                <div>
                  <Label>{t("admin.changeStatus")}</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newStatus === "resolved" && (
                  <>
                    <div>
                      <Label>{t("admin.resolutionAction")}</Label>
                      <Select value={resolutionAction} onValueChange={setResolutionAction}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder={t("admin.selectAction")} /></SelectTrigger>
                        <SelectContent>
                          {RESOLUTION_ACTIONS.map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{t("admin.resolutionNotes")}</Label>
                      <Textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder={t("admin.resolutionNotesPlaceholder")} className="mt-1" />
                    </div>
                  </>
                )}

                <div>
                  <Label>{t("admin.internalNotes")}</Label>
                  <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder={t("admin.internalNotesPlaceholder")} className="mt-1" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>{t("common.cancel")}</Button>
            <Button disabled={saving} onClick={handleUpdate}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.updateComplaint")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
