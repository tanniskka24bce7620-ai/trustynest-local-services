import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth, UserRole } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Users, Loader2 } from "lucide-react";
import servnestLogo from "@/assets/servnest-logo.png";

const Signup = () => {
  const { t } = useTranslation();
  const { role } = useParams<{ role: string }>();
  const userRole = (role === "provider" ? "provider" : "customer") as UserRole;
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    setLoading(true);
    setError("");
    const result = await signup(name, email, password, userRole);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate("/verify-aadhaar");
    }
  };

  const isProvider = userRole === "provider";

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mb-6 flex flex-col items-center text-center">
            <img src={servnestLogo} alt="ServNest" className="mb-4 h-20 w-auto" />
            <h1 className="text-2xl font-bold">{t("auth.createRole", { role: isProvider ? t("auth.serviceProvider") : t("auth.customer") })}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("auth.joinToday")}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">{t("auth.fullName")}</Label>
              <Input id="name" placeholder={t("auth.namePlaceholder")} value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("auth.createAccount")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.haveAccount")}{" "}
            <Link to={`/login/${role}`} className="font-medium text-primary hover:underline">
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
