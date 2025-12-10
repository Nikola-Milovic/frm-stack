import type * as React from "react";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "#providers/auth-provider";
import { LoadingSpinner } from "@yourcompany/web/components/base/loading-spinner";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    // Don't redirect while auth state is still loading
    if (isLoading) {
      return;
    }

    // Redirect unauthenticated users to auth page (unless already on auth page)
    if (!isAuthenticated && !location.pathname.includes("/auth")) {
      navigate("/auth", { replace: true });
      return;
    }

    // Redirect authenticated users away from auth page
    if (isAuthenticated && location.pathname.includes("/auth")) {
      navigate("/", { replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // Show loading spinner while auth state is being determined
  if (isLoading || (!isAuthenticated && !location.pathname.includes("/auth"))) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
