import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event from the redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate("/auth-redirect"), 2000);
    }
  };

  if (!isRecovery && !success) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <p className="text-muted-foreground">{t("auth.invalidResetLink")}</p>
          <Button className="mt-4" onClick={() => navigate("/forgot-password")}>
            {t("auth.requestNewLink")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          {success ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-green-500">
                <CheckCircle className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">{t("auth.passwordUpdated")}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("auth.passwordUpdatedDesc")}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
                  <KeyRound className="h-7 w-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold">{t("auth.resetPassword")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("auth.resetPasswordDesc")}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password">{t("auth.newPassword")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder={t("auth.passwordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("auth.updatePassword")}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
