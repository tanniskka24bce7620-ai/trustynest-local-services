import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ServiceProvider, Review, SERVICE_ICONS } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/authContext";
import { Star, MapPin, Clock, CheckCircle, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import TrustScoreBreakdown from "@/components/TrustScoreBreakdown";

interface Props {
  provider: ServiceProvider;
  onClose: () => void;
}

const ProviderProfile = ({ provider, onClose }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<Review[]>(provider.reviews);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !reviewText.trim() || !user) return;
    const { data, error } = await supabase.from("reviews").insert({ service_profile_id: provider.id, customer_id: user.id, rating, comment: reviewText } as any).select().maybeSingle();
    if (!error && data) {
      const newReview: Review = { id: (data as any).id, customerName: user.name || "You", rating, comment: reviewText, date: new Date().toISOString().slice(0, 10) };
      setReviews([newReview, ...reviews]);
    }
    setSubmitted(true);
    setReviewText("");
    setRating(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 shadow-elevated animate-scale-in">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("providerProfile.title")}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex gap-4">
          <img src={provider.photo} alt={provider.name} className="h-24 w-24 rounded-xl object-cover" />
          <div>
            <h3 className="text-lg font-semibold">{provider.name}</h3>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">{SERVICE_ICONS[provider.serviceType]} {provider.serviceType}</p>
            {provider.verified && (
              <Badge variant="outline" className="mt-1 gap-1 border-success/30 bg-success/10 text-success"><CheckCircle className="h-3 w-3" /> {t("providerProfile.aadhaarVerified")}</Badge>
            )}
            <div className="mt-2 flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium">{provider.rating}</span>
              <span className="text-sm text-muted-foreground">({provider.reviewCount} {t("providerCard.reviews")})</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {provider.area}, {provider.city}</div>
          <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" /> {provider.experience} {t("providerProfile.yearsExperience")}</div>
          <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {provider.contact}</div>
          <div className="text-muted-foreground">{t("common.age")}: {provider.age}</div>
        </div>

        <div className="mt-4 rounded-lg bg-muted p-3"><p className="text-sm">{provider.bio}</p></div>

        <div className="mt-4 flex gap-2">
          <a href={`tel:${provider.contact}`} className="flex-1">
            <Button className="w-full"><Phone className="mr-2 h-4 w-4" /> {t("providerProfile.callNow")}</Button>
          </a>
          <Button className="flex-1 gradient-hero border-0 text-primary-foreground" onClick={() => { onClose(); navigate(`/book?sp=${provider.id}`); }}>{t("providerProfile.bookService")}</Button>
        </div>

        <div className="mt-6 border-t border-border pt-4">
          <h4 className="mb-3 font-semibold">{t("providerProfile.reviews")}</h4>

          {!submitted && user && (
            <form onSubmit={handleSubmitReview} className="mb-4 space-y-3 rounded-lg border border-border p-4">
              <Label>{t("providerProfile.yourRating")}</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}>
                    <Star className={`h-6 w-6 ${s <= (hoverRating || rating) ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <div>
                <Label htmlFor="review">{t("providerProfile.yourReview")}</Label>
                <Textarea id="review" placeholder={t("providerProfile.reviewPlaceholder")} value={reviewText} onChange={(e) => setReviewText(e.target.value)} />
              </div>
              <Button type="submit" size="sm">{t("providerProfile.submitReview")}</Button>
            </form>
          )}

          {submitted && <div className="mb-4 rounded-lg bg-success/10 p-3 text-sm text-success">{t("providerProfile.thankYou")}</div>}

          <div className="space-y-3">
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">{t("providerProfile.noReviews")}</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.customerName}</span>
                  <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /><span className="text-xs">{r.rating}</span></div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;
