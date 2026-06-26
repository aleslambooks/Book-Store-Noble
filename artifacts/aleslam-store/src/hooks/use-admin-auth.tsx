import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  token: string | null;
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

const TOKEN_KEY = "aleslam_admin_token";

function apiUrl(path: string): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
  return `${base}${path}`;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    fetch(apiUrl("/api/admin/me"), {
      headers: { Authorization: `Bearer ${storedToken}` },
      signal: controller.signal,
    })
      .then((r) => (r.ok ? (r.json() as Promise<AdminUser>) : Promise.resolve(null)))
      .then((data) => {
        if (data) {
          setToken(storedToken);
          setAdmin(data);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch((err: unknown) => {
        // AbortError is expected on unmount — don't clear the token
        if (err instanceof Error && err.name !== "AbortError") {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, []);

  const login = useCallback((t: string, a: AdminUser) => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setAdmin(a);
  }, []);

  const logout = useCallback(() => {
    const currentToken = token;
    // Clear state immediately so UI updates right away
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setAdmin(null);
    setLocation("/admin/login");
    // Fire-and-forget server-side session deletion
    if (currentToken) {
      fetch(apiUrl("/api/admin/logout"), {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {
        // Ignore — local state is already cleared
      });
    }
  }, [token, setLocation]);

  return (
    <AdminAuthContext.Provider
      value={{ token, admin, isLoading, isAuthenticated: !!admin, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
