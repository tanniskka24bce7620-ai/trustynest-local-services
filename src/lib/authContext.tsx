import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "provider" | "customer" | null;

interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  verified: boolean;
  profileComplete: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string, role: UserRole) => void;
  signup: (name: string, email: string, password: string, role: UserRole) => void;
  logout: () => void;
  verifyAadhaar: () => void;
  completeProfile: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (email: string, _password: string, role: UserRole) => {
    setUser({ email, name: email.split("@")[0], role, verified: false, profileComplete: false });
  };

  const signup = (name: string, email: string, _password: string, role: UserRole) => {
    setUser({ email, name, role, verified: false, profileComplete: false });
  };

  const logout = () => setUser(null);

  const verifyAadhaar = () => {
    if (user) setUser({ ...user, verified: true });
  };

  const completeProfile = () => {
    if (user) setUser({ ...user, profileComplete: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, verifyAadhaar, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
