"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    phone: string;
    password: string;
    full_name: string;
    labor_category?: string;
    skills?: string[];
    city?: string;
    bio?: string;
    role?: "customer" | "worker" | "cooperative";
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const savedUser = localStorage.getItem("bp_user");
  if (!savedUser) return null;
  try {
    return JSON.parse(savedUser) as User;
  } catch {
    return null;
  }
}

function readStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("bp_token");
}

function hasStoredAuth(): boolean {
  if (typeof window === "undefined") return false;
  return !!(localStorage.getItem("bp_token") && localStorage.getItem("bp_user"));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [loading, setLoading] = useState<boolean>(() => hasStoredAuth());

  const setAuth = useCallback((t: string, u: User) => {
    localStorage.setItem("bp_token", t);
    localStorage.setItem("bp_user", JSON.stringify(u));
    setToken(t);
    setUser(u);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("bp_token");
    localStorage.removeItem("bp_user");
    localStorage.removeItem("bp_active_role"); // Clean up legacy key
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const savedToken = readStoredToken();
    const savedUser = readStoredUser();

    if (!savedToken || !savedUser) {
      return;
    }

    api
      .getMe()
      .then((u) => {
        setUser(u);
        localStorage.setItem("bp_user", JSON.stringify(u));
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setAuth(res.access_token, res.user);
  };

  const register = async (data: {
    email: string;
    phone: string;
    password: string;
    full_name: string;
    labor_category?: string;
    skills?: string[];
    city?: string;
    bio?: string;
    role?: "customer" | "worker" | "cooperative";
  }) => {
    // Cooperative access is admin-controlled; public signup cannot grant admin privileges.
    const backendRole = data.role === "worker" ? "labor" : "employer";
    const res = await api.register({ ...data, role: backendRole });
    setAuth(res.access_token, res.user);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
