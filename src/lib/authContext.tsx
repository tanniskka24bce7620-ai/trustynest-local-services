import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "provider" | "customer" | null;

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  aadhaarVerified: boolean;
  profileComplete: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  verifyAadhaar: (aadhaarNumber: string) => Promise<{ error: string | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function buildAuthUser(supaUser: User): Promise<AuthUser | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", supaUser.id)
    .maybeSingle();

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", supaUser.id)
    .maybeSingle();

  return {
    id: supaUser.id,
    email: supaUser.email || "",
    name: (profile as any)?.name || supaUser.user_metadata?.name || "",
    role: (roleData as any)?.role || null,
    aadhaarVerified: (profile as any)?.aadhaar_verified || false,
    profileComplete: (profile as any)?.profile_complete || false,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const { data: { user: supaUser } } = await supabase.auth.getUser();
    if (supaUser) {
      const authUser = await buildAuthUser(supaUser);
      setUser(authUser);
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser = await buildAuthUser(session.user);
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const authUser = await buildAuthUser(session.user);
        setUser(authUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message || null };
  };

  const signup = async (name: string, email: string, password: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };

    if (data.user && role) {
      await supabase.from("user_roles").insert({ user_id: data.user.id, role } as any);
      await supabase.from("profiles").update({ name } as any).eq("user_id", data.user.id);
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const verifyAadhaar = async (aadhaarNumber: string): Promise<{ error: string | null }> => {
    if (!user) return { error: "Not authenticated" };

    const { data, error } = await supabase.functions.invoke("verify-aadhaar", {
      body: { aadhaar_number: aadhaarNumber },
    });

    if (error) {
      return { error: error.message || "Verification failed" };
    }

    if (data?.error) {
      return { error: data.error };
    }

    // Refresh user state from database
    await refreshUser();
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, verifyAadhaar, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
