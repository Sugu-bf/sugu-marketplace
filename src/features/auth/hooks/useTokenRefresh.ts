"use client";

/**
 * useTokenRefresh — Auto-refresh silencieux du token Sanctum
 *
 * Stratégie zéro-SMS :
 *  - Le token dure 90 jours (configuré backend)
 *  - Ce hook vérifie à l'init et toutes les heures si le token expire dans < 7 jours
 *  - Si oui → POST /web-auth/refresh-token → nouveau token 90j → cookie mis à jour
 *  - L'user reste connecté indéfiniment tant qu'il visite le site au moins une fois
 *    dans les 7 derniers jours (fenêtre de refresh)
 *  - 0 SMS, 0 interaction utilisateur
 */

import { useEffect, useRef } from "react";
import {
  tokenDaysRemaining,
  getTokenExpiry,
  getAuthTokenCookie,
  refreshToken,
} from "@/features/auth/services/auth-service";

/** Seuil de refresh : si token expire dans moins de REFRESH_THRESHOLD_DAYS */
const REFRESH_THRESHOLD_DAYS = 7;

/** Vérifier toutes les heures (en ms) */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function useTokenRefresh() {
  const refreshing = useRef(false);

  const tryRefresh = async () => {
    // Ne refresh que si le user est connecté (cookie présent)
    const token = getAuthTokenCookie();
    if (!token) return;

    // Ne refresh que si on a une date d'expiration enregistrée
    const expiry = getTokenExpiry();
    if (!expiry) return;

    // Ne refresh que si le token expire bientôt
    const daysLeft = tokenDaysRemaining();
    if (daysLeft > REFRESH_THRESHOLD_DAYS) return;

    // Anti-double-refresh
    if (refreshing.current) return;
    refreshing.current = true;

    try {
      await refreshToken();
      console.debug("[auth] Token auto-refreshed silently. Days left were:", daysLeft);
    } catch (err) {
      // Non bloquant — si le refresh échoue (token révoqué, serveur down...)
      // l'user sera redirigé vers /login au prochain appel API protégé
      console.debug("[auth] Token refresh failed (non-blocking):", err);
    } finally {
      refreshing.current = false;
    }
  };

  useEffect(() => {
    // Vérifier immédiatement au chargement de la page
    tryRefresh();

    // Puis toutes les heures
    const interval = setInterval(tryRefresh, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
