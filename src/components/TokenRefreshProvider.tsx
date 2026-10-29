"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTokenRefresh } from "@/features/auth/hooks/useTokenRefresh";

/**
 * TokenRefreshProvider
 * Composant client minimal — branché dans le root layout.
 * Lance l'auto-refresh silencieux du token (zéro SMS, zéro interaction), et
 * quand le backend met fin à la session (`auth:session-expired`), recharge
 * les données serveur de la page : elle s'affiche alors déconnectée au lieu
 * de garder l'état d'une session qui n'existe plus.
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useTokenRefresh();

  useEffect(() => {
    const onSessionExpired = () => router.refresh();
    window.addEventListener("auth:session-expired", onSessionExpired);
    return () => window.removeEventListener("auth:session-expired", onSessionExpired);
  }, [router]);

  return <>{children}</>;
}
