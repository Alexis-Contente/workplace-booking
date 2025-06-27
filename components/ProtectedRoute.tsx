"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Rediriger vers login si pas d'utilisateur connecté
      router.push("/login");
    }
  }, [user, loading, router]);

  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si pas d'utilisateur, ne rien afficher (redirection en cours)
  if (!user) {
    return null;
  }

  // Si utilisateur connecté, afficher le contenu
  return <>{children}</>;
}
