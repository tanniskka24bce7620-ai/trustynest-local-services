import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, Loader2 } from "lucide-react";

const VerifyAadhaar = () => {
  const { user, loading: authLoading, verifyAadhaar } = useAuth();
  const navigate = useNavigate();
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"aadhaar" | "otp" | "verified">("aadhaar");
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;

  if (!user) {
    navigate("/");
    return null;
  }

  // If already verified, skip to dashboard
  if (user.aadhaarVerified) {
    navigate(user.role === "provider" ? "/provider-dashboard" : "/customer-dashboard");
    return null;
  }

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaar.replace(/\s/g, "").length !== 12) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 1500);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setTimeout(async () => {
      await verifyAadhaar();
      setLoading(false);
      setStep("verified");
    }, 2000);
  };

  const handleContinue = () => {
    navigate(user.role === "provider" ? "/provider-dashboard" : "/customer-dashboard");
  };

  const formatAadhaar = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${step === "verified" ? "gradient-success" : "gradient-hero"}`}>
              {step === "verified" ? (
                <CheckCircle className="h-7 w-7 text-primary-foreground" />
              ) : (
                <Shield className="h-7 w-7 text-primary-foreground" />
              )}
            </div>
            <h1 className="text-2xl font-bold">
              {step === "verified" ? "Verification Complete!" : "Aadhaar Verification"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "verified"
                ? "Your identity has been verified successfully."
                : "Verify your identity to build trust on ServNest"}
            </p>
          </div>

          {step === "aadhaar" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <Label htmlFor="aadhaar">Aadhaar Number</Label>
                <Input
                  id="aadhaar"
                  placeholder="XXXX XXXX XXXX"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(formatAadhaar(e.target.value))}
                  maxLength={14}
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">Enter your 12-digit Aadhaar number</p>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
                OTP sent to mobile linked with Aadhaar ****{aadhaar.replace(/\s/g, "").slice(-4)}
              </div>
              <div>
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Verify
              </Button>
            </form>
          )}

          {step === "verified" && (
            <div className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-sm font-medium text-success">
                <CheckCircle className="h-4 w-4" /> Aadhaar Verified
              </div>
              <Button onClick={handleContinue} className="w-full" size="lg">
                Continue to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyAadhaar;
