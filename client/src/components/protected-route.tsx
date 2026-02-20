import { Redirect, useRoute } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowDuringOnboarding?: boolean;
}

export function ProtectedRoute({ children, allowDuringOnboarding }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, baker } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (baker && !baker.onboardingCompleted && !allowDuringOnboarding && baker.role !== "super_admin") {
    return <Redirect to="/onboarding" />;
  }

  return <>{children}</>;
}
