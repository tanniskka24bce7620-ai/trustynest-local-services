import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { Loader2 } from "lucide-react";

const AuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/");
      return;
    }
    if (!user.aadhaarVerified) {
      navigate("/verify-aadhaar");
    } else {
      navigate(user.role === "provider" ? "/provider-dashboard" : "/customer-dashboard");
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AuthRedirect;
