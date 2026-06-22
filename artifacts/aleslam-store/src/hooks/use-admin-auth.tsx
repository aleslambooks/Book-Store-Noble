import { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";

interface AdminUser { id: number; email: string; name: string; role: string; }
interface AdminAuthContextType {
  token: string | null;
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
}
const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem("aleslam_admin_token");
    if (!storedToken) { setIsLoading(false); return; }
    fetch("/api/admin/me", { headers: { Authorization: "Bearer " + storedToken } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setToken(storedToken); setAdmin(data); }
        else { localStorage.removeItem("aleslam_admin_token"); }
      })
      .catch(() => { localStorage.removeItem("aleslam_admin_token"); })
      .finally(() => setIsLoading(false));
  }, []);

  const login = (t: string, a: AdminUser) => {
    localStorage.setItem("aleslam_admin_token", t);
    setToken(t); setAdmin(a);
  };
  const logout = () => {
    if (token) fetch("/api/admin/logout", { method: "POST", headers: { Authorization: "Bearer " + token } }).catch(() => {});
    localStorage.removeItem("aleslam_admin_token");
    setToken(null); setAdmin(null);
    setLocation("/admin/login");
  };

  return (
    <AdminAuthContext.Provider value={{ token, admin, isLoading, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
