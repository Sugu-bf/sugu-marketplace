"use client";

import { useTokenRefresh } from "@/features/auth/hooks/useTokenRefresh";

/**
 * TokenRefreshProvider
 * Composant client minimal — branché dans le root layout.
 * Lance l'auto-refresh silencieux du token (zéro SMS, zéro interaction).
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  useTokenRefresh();
  return <>{children}</>;
}
