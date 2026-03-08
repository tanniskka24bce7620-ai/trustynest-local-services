import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  score: number;
  size?: "sm" | "md";
}

const getScoreInfo = (score: number) => {
  if (score >= 90) return { label: "Excellent", color: "text-success", bg: "bg-success/10 border-success/30", icon: ShieldCheck };
  if (score >= 75) return { label: "Very Reliable", color: "text-success", bg: "bg-success/10 border-success/30", icon: ShieldCheck };
  if (score >= 60) return { label: "Good", color: "text-primary", bg: "bg-primary/10 border-primary/30", icon: Shield };
  if (score >= 40) return { label: "Average", color: "text-warning", bg: "bg-warning/10 border-warning/30", icon: Shield };
  return { label: "Needs Improvement", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30", icon: ShieldAlert };
};

const TrustScoreBadge = ({ score, size = "sm" }: Props) => {
  const info = getScoreInfo(score);
  const Icon = info.icon;
  const isSmall = size === "sm";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${info.bg} ${info.color} ${isSmall ? "text-[10px]" : "text-xs"} font-semibold cursor-help`}>
          <Icon className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
          <span>{score}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">Trust Score: {score}/100</p>
        <p className="text-xs text-muted-foreground">{info.label} — Based on ratings, jobs, reviews & complaints</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default TrustScoreBadge;
