import { useTranslation } from "react-i18next";
import { Star, Wrench, ThumbsUp, ShieldAlert, XCircle, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TrustData {
  trust_score: number;
  completed_jobs: number;
  positive_reviews: number;
  complaints_count: number;
  cancellations: number;
  average_rating: number;
}

interface Props {
  data: TrustData;
}

const getScoreInfo = (score: number) => {
  if (score >= 90) return { label: "Excellent ⭐⭐⭐⭐⭐", color: "text-success" };
  if (score >= 75) return { label: "Very Reliable ⭐⭐⭐⭐", color: "text-success" };
  if (score >= 60) return { label: "Good ⭐⭐⭐", color: "text-primary" };
  if (score >= 40) return { label: "Average ⭐⭐", color: "text-warning" };
  return { label: "Needs Improvement ⚠", color: "text-destructive" };
};

const getScoreColor = (score: number) => {
  if (score >= 75) return "bg-success";
  if (score >= 60) return "bg-primary";
  if (score >= 40) return "bg-warning";
  return "bg-destructive";
};

const TrustScoreBreakdown = ({ data }: Props) => {
  const { t } = useTranslation();
  const info = getScoreInfo(data.trust_score);

  const metrics = [
    { icon: Star, label: t("trustScore.ratingScore"), value: `${data.average_rating}/5`, bar: (Number(data.average_rating) / 5) * 100, color: "bg-warning" },
    { icon: Wrench, label: t("trustScore.completedJobs"), value: data.completed_jobs, bar: Math.min(100, Number(data.completed_jobs) * 2), color: "bg-primary" },
    { icon: ThumbsUp, label: t("trustScore.positiveReviews"), value: data.positive_reviews, bar: Math.min(100, Number(data.positive_reviews) * 3), color: "bg-success" },
    { icon: ShieldAlert, label: t("trustScore.complaints"), value: data.complaints_count, bar: Math.min(100, Number(data.complaints_count) * 20), color: "bg-destructive" },
    { icon: XCircle, label: t("trustScore.cancellations"), value: data.cancellations, bar: Math.min(100, Number(data.cancellations) * 20), color: "bg-destructive" },
  ];

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" className="stroke-muted" strokeWidth="6" />
            <circle cx="40" cy="40" r="35" fill="none" className={`${getScoreColor(data.trust_score).replace("bg-", "stroke-")}`} strokeWidth="6" strokeDasharray={`${(data.trust_score / 100) * 220} 220`} strokeLinecap="round" />
          </svg>
          <span className="absolute text-lg font-bold">{data.trust_score}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">{t("trustScore.title")}</h4>
          </div>
          <p className={`text-sm font-medium ${info.color}`}>{info.label}</p>
          <p className="text-xs text-muted-foreground">{t("trustScore.outOf100")}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <m.icon className="h-3.5 w-3.5" /> {m.label}
              </span>
              <span className="font-medium">{String(m.value)}</span>
            </div>
            <Progress value={m.bar} className={`h-1.5 [&>div]:${m.color}`} />
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">{t("trustScore.disclaimer")}</p>
    </div>
  );
};

export default TrustScoreBreakdown;
