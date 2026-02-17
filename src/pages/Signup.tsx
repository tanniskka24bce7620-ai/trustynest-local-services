import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth, UserRole } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Users, Loader2 } from "lucide-react";

const Signup = () => {
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
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${isProvider ? "gradient-hero" : "gradient-success"}`}>
              {isProvider ? <Wrench className="h-7 w-7 text-primary-foreground" /> : <Users className="h-7 w-7 text-primary-foreground" />}
            </div>
            <h1 className="text-2xl font-bold">Create {isProvider ? "Provider" : "Customer"} Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">Join ServNest today</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to={`/login/${role}`} className="font-medium text-primary hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
