"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

/**
 * ProtectedRoute Component
 *
 * This component acts as a wrapper to protect routes/pages from unauthorized access.
 * It ensures only authenticated users can access the wrapped content.
 * If a user is not authenticated, they will be automatically redirected to the login page.
 */

// Props interface for the ProtectedRoute component
type ProtectedRouteProps = {
  children: React.ReactNode; // The content/components to be protected
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Get authentication state and loading status from custom auth hook
  const { user, loading } = useAuth();

  // Next.js router for programmatic navigation
  const router = useRouter();

  /**
   * Effect hook to handle authentication redirects
   * Runs whenever user, loading, or router changes
   */
  useEffect(() => {
    // Only redirect if loading is complete and no user is authenticated
    if (!loading && !user) {
      // Rediriger vers login si pas d'utilisateur connecté
      // Redirect to login page if no user is connected
      router.push("/login");
    }
  }, [user, loading, router]); // Dependencies: re-run when these values change

  /**
   * Loading State Handler
   * Display a loading spinner while authentication status is being determined
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Animated loading spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  /**
   * Unauthenticated State Handler
   * Return null while redirect is in progress to avoid flashing content
   */
  // Si pas d'utilisateur, ne rien afficher (redirection en cours)
  if (!user) {
    return null; // Don't render anything during redirect
  }

  /**
   * Authenticated State Handler
   * User is authenticated - render the protected content
   */
  // Si utilisateur connecté, afficher le contenu
  return <>{children}</>;
}
