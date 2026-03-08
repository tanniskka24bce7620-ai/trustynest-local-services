import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, ShieldAlert, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const COMPLAINT_TYPES = [
  "Late Arrival",
  "Poor Service Quality",
  "Fraud / Scam",
  "Incomplete Work",
  "Misbehavior",
  "Overcharging",
  "Other",
];

const SEVERITY_LEVELS = ["low", "medium", "high"] as const;

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};

interface ComplaintFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId?: string;
  bookingCode?: string;
  providerName: string;
  providerUserId: string;
  serviceProfileId: string;
  serviceType: string;
}

const ComplaintForm = ({
  open, onOpenChange, bookingId, bookingCode,
  providerName, providerUserId, serviceProfileId, serviceType,
}: ComplaintFormProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [complaintType, setComplaintType] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<string>("medium");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (files.length + selected.length > 5) {
      toast({ title: t("complaint.maxFiles"), variant: "destructive" });
      return;
    }
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!user || !complaintType || !description.trim()) return;
    setSubmitting(true);

    // Upload evidence files
    const evidenceUrls: string[] = [];
    for (const file of files) {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("complaint-evidence").upload(filePath, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("complaint-evidence").getPublicUrl(filePath);
        evidenceUrls.push(urlData.publicUrl);
      }
    }

    const { data, error } = await supabase.from("complaints" as any).insert({
      customer_id: user.id,
      provider_user_id: providerUserId,
      service_profile_id: serviceProfileId,
      booking_id: bookingId || null,
      complaint_type: complaintType,
      description: description.trim(),
      severity,
      evidence_urls: evidenceUrls,
    } as any).select().maybeSingle();

    setSubmitting(false);
    if (error) {
      toast({ title: t("complaint.submitError"), description: error.message, variant: "destructive" });
    } else {
      setSuccess((data as any)?.complaint_code?.toUpperCase() || "SUBMITTED");
    }
  };

  const handleClose = () => {
    setComplaintType("");
    setDescription("");
    setSeverity("medium");
    setFiles([]);
    setSuccess(null);
    onOpenChange(false);
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold">{t("complaint.submitted")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("complaint.submittedDesc")}</p>
            <div className="mt-4 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">{t("complaint.complaintId")}</p>
              <p className="font-mono font-bold text-lg">{success}</p>
            </div>
            <Button className="mt-6 w-full" onClick={handleClose}>{t("common.close")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            {t("complaint.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Auto-filled fields */}
          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            {bookingCode && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("booking.bookingId")}</span>
                <span className="font-mono font-medium">{bookingCode.toUpperCase()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("booking.provider")}</span>
              <span className="font-medium">{providerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("booking.service")}</span>
              <span>{serviceType}</span>
            </div>
          </div>

          {/* Complaint Type */}
          <div>
            <Label>{t("complaint.type")}</Label>
            <Select value={complaintType} onValueChange={setComplaintType}>
              <SelectTrigger className="mt-1"><SelectValue placeholder={t("complaint.selectType")} /></SelectTrigger>
              <SelectContent>
                {COMPLAINT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label>{t("complaint.description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("complaint.descriptionPlaceholder")}
              className="mt-1"
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">{description.length}/1000</p>
          </div>

          {/* Severity */}
          <div>
            <Label>{t("complaint.severity")}</Label>
            <div className="flex gap-2 mt-1">
              {SEVERITY_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all capitalize ${
                    severity === level
                      ? SEVERITY_STYLES[level] + " ring-2 ring-offset-1 ring-current"
                      : "border-border bg-card hover:bg-accent"
                  }`}
                >
                  {t(`complaint.${level}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Upload */}
          <div>
            <Label>{t("complaint.evidence")}</Label>
            <p className="text-xs text-muted-foreground mb-2">{t("complaint.evidenceHint")}</p>
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-1 rounded-lg border border-border bg-muted px-2 py-1 text-xs">
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button type="button" onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {files.length < 5 && (
                <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Upload className="h-3 w-3" />
                  {t("complaint.uploadFile")}
                  <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          {/* Transparency note */}
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            {t("complaint.transparencyNote")}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>{t("common.cancel")}</Button>
          <Button
            disabled={!complaintType || !description.trim() || submitting}
            onClick={handleSubmit}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("complaint.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintForm;
