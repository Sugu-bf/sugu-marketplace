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
 *
 * Plusieurs onglets partagent le même cookie : un seul rafraîchit à la fois
 * (verrou Web Locks), et celui qui obtient le verrou relit l'échéance avant
 * d'appeler l'API, car un autre onglet vient peut-être de la repousser.
 */

import { useEffect } from "react";
import {
  tokenDaysRemaining,
  hasAuthSession,
  refreshToken,
  clearAuthTokenCookie,
} from "@/features/auth/services/auth-service";
import { isApiError } from "@/lib/api/errors";

/** Seuil de refresh : si token expire dans moins de REFRESH_THRESHOLD_DAYS */
const REFRESH_THRESHOLD_DAYS = 7;

/** Vérifier toutes les heures (en ms) */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;

const REFRESH_LOCK_NAME = "sugu-auth-token-refresh";

/**
 * Codes par lesquels le backend dit que la session est terminée (plafond de
 * la chaîne de rotation, appareil différent). Tout autre échec — réseau, 5xx,
 * 401 sans code, rotation déjà faite par un autre onglet — laisse le cookie.
 */
const SESSION_ENDED_CODES = new Set(["AUTH_080", "AUTH_081"]);

function isDue(): boolean {
  return hasAuthSession() && tokenDaysRemaining() <= REFRESH_THRESHOLD_DAYS;
}

let refreshingInThisTab = false;

async function refreshWhileHoldingLock(): Promise<void> {
  // Relu sous verrou : l'onglet qui tenait le verrou a peut-être déjà renouvelé.
  if (!isDue()) return;

  try {
    await refreshToken();
  } catch (err) {
    if (isApiError(err) && err.status === 401 && SESSION_ENDED_CODES.has(err.details?.errorCode ?? "")) {
      await clearAuthTokenCookie();
      window.dispatchEvent(new CustomEvent("auth:session-expired", {
        detail: { reason: "refresh_failed", status: err.status },
      }));
    }
  }
}

/**
 * Renouvelle le token s'il arrive à échéance, au plus une fois à la fois
 * pour tous les onglets du navigateur.
 */
export async function refreshTokenIfDue(): Promise<void> {
  if (typeof window === "undefined" || !isDue() || refreshingInThisTab) return;

  refreshingInThisTab = true;
  try {
    const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
    if (locks) {
      // ifAvailable : un autre onglet rafraîchit déjà, celui-ci n'attend pas.
      await locks.request(REFRESH_LOCK_NAME, { ifAvailable: true }, async (lock) => {
        if (lock) await refreshWhileHoldingLock();
      });
    } else {
      await refreshWhileHoldingLock();
    }
  } finally {
    refreshingInThisTab = false;
  }
}

export function useTokenRefresh() {
  useEffect(() => {
    void refreshTokenIfDue();
    const interval = setInterval(() => void refreshTokenIfDue(), CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);
}
