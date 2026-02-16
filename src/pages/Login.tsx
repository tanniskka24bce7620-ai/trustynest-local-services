import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth, UserRole } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Users } from "lucide-react";

const Login = () => {
  const { role } = useParams<{ role: string }>();
  const userRole = (role === "provider" ? "provider" : "customer") as UserRole;
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    login(email, password, userRole);
    navigate("/verify-aadhaar");
  };

  const isProvider = userRole === "provider";

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${isProvider ? "gradient-hero" : "gradient-success"}`}>
              {isProvider ? <Wrench className="h-7 w-7 text-primary-foreground" /> : <Users className="h-7 w-7 text-primary-foreground" />}
            </div>
            <h1 className="text-2xl font-bold">
              {isProvider ? "Service Provider" : "Customer"} Login
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your {isProvider ? "provider" : "customer"} account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" size="lg">Sign In</Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to={`/signup/${role}`} className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </p>

          <div className="mt-4 text-center">
            <Link to={`/login/${isProvider ? "customer" : "provider"}`} className="text-xs text-muted-foreground hover:text-primary">
              Login as {isProvider ? "Customer" : "Service Provider"} instead →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
