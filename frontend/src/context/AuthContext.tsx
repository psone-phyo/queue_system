import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE, api, setAccessToken } from "../lib/api";
import type { Staff } from "../types";

interface AuthContextValue {
  staff: Staff | null;
  busy: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const refreshAttempted = useRef(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [busy, setBusy] = useState(true);

  const bootstrap = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (response.ok) {
        const data = await response.json() as { accessToken: string };
        setAccessToken(data.accessToken);
        const payload = data.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const decoded = decodeURIComponent(atob(payload).split("").map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`).join(""));
        const claims = JSON.parse(decoded) as { sub: string; role: Staff["role"]; name: string };
        setStaff({ id: claims.sub, role: claims.role, name: claims.name });
      }
    } catch {
      setAccessToken(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith("/staff")) {
      setBusy(false);
      return;
    }
    if (refreshAttempted.current) return;
    refreshAttempted.current = true;
    setBusy(true);
    void bootstrap();
  }, [bootstrap, location.pathname]);

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await api<{ accessToken: string; staff: Staff }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false);
    setAccessToken(data.accessToken);
    setStaff(data.staff);
  }, []);

  const signOut = useCallback(async () => {
    try { await api("/api/auth/logout", { method: "POST" }, false); }
    finally { setAccessToken(null); setStaff(null); }
  }, []);

  const value = useMemo(() => ({ staff, busy, signIn, signOut }), [staff, busy, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
