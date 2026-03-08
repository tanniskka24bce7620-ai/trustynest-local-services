import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          {sent ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-500">
                <CheckCircle className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">{t("auth.resetEmailSent")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("auth.resetEmailSentDesc", { email })}
              </p>
              <Link to="/login/customer" className="mt-6 text-sm font-medium text-primary hover:underline">
                <ArrowLeft className="mr-1 inline h-4 w-4" />
                {t("auth.backToLogin")}
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                  <Mail className="h-7 w-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold">{t("auth.forgotPassword")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("auth.forgotPasswordDesc")}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("auth.sendResetLink")}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login/customer" className="text-sm text-muted-foreground hover:text-primary">
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  {t("auth.backToLogin")}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
