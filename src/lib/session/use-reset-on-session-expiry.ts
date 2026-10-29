"use client";

import { useEffect } from "react";
import { resetClientSession } from "./reset-client-session";

/** Fired by useTokenRefresh when the backend refused to extend the session. */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";

/**
 * When the session ends without a logout (refresh refused), the account's
 * data still sits in this browser: clear it and reload the current page as a
 * visitor (a protected page then sends to login).
 */
export function useResetOnSessionExpiry(): void {
  useEffect(() => {
    const onExpired = () => {
      void resetClientSession(`${window.location.pathname}${window.location.search}`);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);
}
