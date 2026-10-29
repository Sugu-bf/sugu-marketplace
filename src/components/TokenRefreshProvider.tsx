"use client";

import { useTokenRefresh } from "@/features/auth/hooks/useTokenRefresh";
import { useResetOnSessionExpiry } from "@/lib/session/use-reset-on-session-expiry";

/**
 * TokenRefreshProvider
 * Composant client minimal — branché dans le root layout.
 * Lance l'auto-refresh silencieux du token (zéro SMS, zéro interaction) et,
 * si la session expire, purge ce qu'elle a laissé dans le navigateur.
 */
export function TokenRefreshProvider({ children }: { children: React.ReactNode }) {
  useTokenRefresh();
  useResetOnSessionExpiry();
  return <>{children}</>;
}
