"use client";

import Loading from "@/app/loading";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard component that protects routes requiring authentication
 *
 * Why: Prevents unauthorized access to protected pages
 * Why: Provides immediate client-side redirect for better UX
 * Why: Centralizes authentication logic for protected routes
 */
export function AuthGuard({ children, redirectTo = "/" }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Why: Only redirect after loading is complete to avoid premature redirects
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  // Why: Show loading state while authentication is being determined
  if (loading) {
    return <Loading />;
  }

  // Why: Return null during redirect to prevent flash of protected content
  if (!user) {
    return null;
  }

  // Why: Only render children when user is authenticated
  return <>{children}</>;
}
