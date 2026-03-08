import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_ICONS } from "@/lib/mockData";
import { Trophy, Star, Crown, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Winner {
  id: string;
  provider_name: string;
  service_type: string;
  photo_url: string;
  month_year: string;
  rank: number;
  score: number;
  average_rating: number;
  jobs_completed: number;
  positive_reviews: number;
}

const RANK_ICONS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

const HallOfFame = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("monthly_winners")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setWinners(data as unknown as Winner[]);
      setLoading(false);
    };
    load();
  }, []);

  // Group by month
  const grouped = winners.reduce<Record<string, Winner[]>>((acc, w) => {
    if (!acc[w.month_year]) acc[w.month_year] = [];
    acc[w.month_year].push(w);
    return acc;
  }, {});

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-1 h-4 w-4" /> {t("booking.back")}
      </Button>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
          <Trophy className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold">{t("hallOfFame.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("hallOfFame.subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="py-16 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-lg text-muted-foreground">{t("hallOfFame.empty")}</p>
          <p className="text-sm text-muted-foreground">{t("hallOfFame.emptyDesc")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([monthYear, monthWinners]) => (
            <div key={monthYear} className="animate-fade-in">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-sm font-semibold bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                  📅 {monthYear}
                </Badge>
              </div>
              <div className="space-y-2">
                {monthWinners.sort((a, b) => a.rank - b.rank).map((w) => {
                  const avatarSrc = w.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(w.provider_name)}&background=3b82f6&color=fff`;
                  return (
                    <div
                      key={w.id}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-card ${
                        w.rank === 1 ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/10" : "border-border bg-card"
                      }`}
                    >
                      <span className="text-2xl">{RANK_ICONS[w.rank] || `#${w.rank}`}</span>
                      <img src={avatarSrc} alt={w.provider_name} className="h-12 w-12 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{w.provider_name}</h3>
                          {w.rank === 1 && <Crown className="h-4 w-4 text-amber-500 fill-amber-400" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {SERVICE_ICONS[w.service_type] || "🔧"} {w.service_type}
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          {Number(w.average_rating).toFixed(1)}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs font-mono">
                        {Number(w.score).toFixed(0)} pts
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HallOfFame;
