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
  hasAuthSession,
  refreshToken,
  clearAuthTokenCookie,
} from "@/features/auth/services/auth-service";
import { isApiError } from "@/lib/api/errors";

/** Seuil de refresh : si token expire dans moins de REFRESH_THRESHOLD_DAYS */
const REFRESH_THRESHOLD_DAYS = 7;

/** Vérifier toutes les heures (en ms) */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

export function useTokenRefresh() {
  const refreshing = useRef(false);

  const tryRefresh = async () => {
    // Ne refresh que si le user a une session locale.
    if (!hasAuthSession()) return;

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
      // Backend signale un vol de token (fingerprint device différent) ou une
      // session dont la chaîne de rotation a dépassé son plafond absolu (H4).
      // Dans les deux cas le cookie est devenu inutile : on le purge tout de
      // suite plutôt que d'attendre le prochain appel protégé pour planter.
      // Une erreur réseau / 5xx ne déclenche PAS de logout (non bloquant).
      if (isApiError(err) && err.status === 401) {
        void clearAuthTokenCookie();
        // Pas de redirect forcé ici (l'utilisateur navigue peut-être sur
        // une page publique) — le prochain accès à une page protégée le
        // renverra vers /login via le middleware serveur.
      }
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
