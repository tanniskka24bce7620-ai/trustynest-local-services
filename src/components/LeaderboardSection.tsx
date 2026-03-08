import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SERVICE_ICONS } from "@/lib/mockData";
import { Star, Trophy, Wrench, MessageSquare, Crown, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  service_profile_id: string;
  user_id: string;
  provider_name: string;
  service_type: string;
  photo_url: string;
  average_rating: number;
  jobs_completed: number;
  positive_reviews: number;
  score: number;
  rank: number;
}

const RANK_STYLES: Record<number, { bg: string; border: string; badge: string; icon: string }> = {
  1: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-700", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200", icon: "🥇" },
  2: { bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-300 dark:border-slate-600", badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200", icon: "🥈" },
  3: { bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-300 dark:border-orange-700", badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200", icon: "🥉" },
};

const LeaderboardSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", { result_limit: 10 });
      if (!error && data) {
        setEntries(data as unknown as LeaderboardEntry[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (entries.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-2 flex items-center justify-center gap-2">
        <Trophy className="h-7 w-7 text-amber-500" />
        <h2 className="text-center text-3xl font-bold">{t("leaderboard.title")}</h2>
      </div>
      <p className="mb-8 text-center text-muted-foreground">{t("leaderboard.subtitle")}</p>

      {/* Top 3 highlight */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {entries.slice(0, 3).map((entry, i) => {
          const style = RANK_STYLES[entry.rank] || RANK_STYLES[3];
          const avatarSrc = entry.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.provider_name)}&background=3b82f6&color=fff`;
          return (
            <div
              key={entry.service_profile_id}
              className={`relative rounded-2xl border-2 ${style.border} ${style.bg} p-6 shadow-soft transition-all hover:shadow-card animate-fade-in`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {entry.rank === 1 && (
                <div className="absolute -top-3 -right-2 text-2xl animate-bounce">
                  <Crown className="h-7 w-7 text-amber-500 fill-amber-400" />
                </div>
              )}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img
                    src={avatarSrc}
                    alt={entry.provider_name}
                    className="h-16 w-16 rounded-xl object-cover ring-2 ring-background"
                  />
                  <span className="absolute -bottom-2 -left-2 text-2xl">{style.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold truncate text-lg">{entry.provider_name}</h3>
                    {entry.rank === 1 && (
                      <Badge className="text-[10px] bg-amber-500 text-white border-0">{t("leaderboard.topProvider")}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {SERVICE_ICONS[entry.service_type] || "🔧"} {entry.service_type}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-background/60 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    <span className="font-bold text-sm">{Number(entry.average_rating).toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t("leaderboard.rating")}</p>
                </div>
                <div className="rounded-lg bg-background/60 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Wrench className="h-3.5 w-3.5 text-primary" />
                    <span className="font-bold text-sm">{entry.jobs_completed}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t("leaderboard.jobs")}</p>
                </div>
                <div className="rounded-lg bg-background/60 p-2">
                  <div className="flex items-center justify-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-success" />
                    <span className="font-bold text-sm">{entry.positive_reviews}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t("leaderboard.reviews")}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Badge variant="outline" className={style.badge}>
                  {t("leaderboard.score")}: {Number(entry.score).toFixed(0)}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => navigate(`/book?sp=${entry.service_profile_id}`)}>
                  {t("providerCard.bookService")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Remaining ranks 4-10 */}
      {entries.length > 3 && (
        <div className="space-y-2">
          {entries.slice(3).map((entry, i) => {
            const avatarSrc = entry.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.provider_name)}&background=3b82f6&color=fff`;
            return (
              <div
                key={entry.service_profile_id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-card animate-fade-in"
                style={{ animationDelay: `${(i + 3) * 0.05}s` }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-sm text-muted-foreground">
                  #{entry.rank}
                </div>
                <img src={avatarSrc} alt={entry.provider_name} className="h-10 w-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm truncate">{entry.provider_name}</h4>
                  <p className="text-xs text-muted-foreground">{SERVICE_ICONS[entry.service_type] || "🔧"} {entry.service_type}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /> {Number(entry.average_rating).toFixed(1)}</span>
                  <span className="flex items-center gap-1"><Wrench className="h-3 w-3" /> {entry.jobs_completed}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {entry.positive_reviews}</span>
                </div>
                <Badge variant="secondary" className="text-xs">{Number(entry.score).toFixed(0)} pts</Badge>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/book?sp=${entry.service_profile_id}`)}>
                  {t("providerCard.bookService")}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Transparency note */}
      <p className="mt-6 text-center text-xs text-muted-foreground max-w-2xl mx-auto">
        {t("leaderboard.transparency")}
      </p>

      {/* Hall of Fame link */}
      <div className="mt-6 flex justify-center">
        <Link to="/hall-of-fame">
          <Button variant="outline" className="gap-1">
            <Trophy className="h-4 w-4" />
            {t("leaderboard.hallOfFame")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default LeaderboardSection;
