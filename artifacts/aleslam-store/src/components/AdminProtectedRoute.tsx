import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (!isAuthenticated) return <Redirect to="/admin/login" />;
  return <>{children}</>;
}
