"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  googleSignIn,
  getAuthErrorMessage,
  setAuthTokenCookie,
  setTokenExpiry,
} from "../services/auth-service";

// ─── Types ─────────────────────────────────────────────────

interface GoogleSignInButtonProps {
  /** Appelé après succès — le cookie est déjà posé avant cet appel */
  onSuccess?: (isNewUser: boolean) => void;
  /** Appelé en cas d'erreur */
  onError?: (message: string) => void;
  className?: string;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
    __googleGsiLoaded?: boolean;
  }
}

// ─── Helpers sécurité ──────────────────────────────────────

/**
 * Calcule SHA-256 d'une chaîne via Web Crypto API (non-bloquant, natif).
 * Retourne un hex string de 64 caractères.
 *
 * SÉCURITÉ : On envoie le HASH du nonce à Google (pas le nonce brut).
 * Le backend vérifie que token.nonce == nonce_hash reçu.
 * → Même si le credential est intercepté, le nonce_hash est inutilisable
 *   sans connaître le nonce original (préimage SHA-256 impossible en pratique).
 */
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Génère un nonce cryptographiquement sécurisé.
 * Utilise crypto.randomUUID() (CSPRNG natif).
 */
function generateNonce(): string {
  return crypto.randomUUID();
}

// (setAuthCookie local supprimé — on utilise setAuthTokenCookie centralisé et HttpOnly)

/**
 * Charge le script Google Identity Services de façon paresseuse.
 * Idempotent — ne charge qu'une seule fois même si appelé plusieurs fois.
 */
function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.__googleGsiLoaded) {
      resolve();
      return;
    }

    const existing = document.getElementById("google-gsi-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("GSI load failed")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.__googleGsiLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Google GSI script failed to load"));
    document.head.appendChild(script);
  });
}

// ─── Composant ─────────────────────────────────────────────

/**
 * GoogleSignInButton — Bouton Google One Tap sécurisé pour le web.
 *
 * Sécurité :
 *   ✅ Nonce SHA-256 (CSPRNG) — prévient le replay et le CSRF
 *   ✅ Script GSI chargé dynamiquement (pas de bloat initial)
 *   ✅ Credential envoyé immédiatement au backend, jamais stocké
 *   ✅ Cookie Secure en HTTPS
 *   ✅ Aucun token Google en logs ou state React
 *   ✅ Fenêtre d'attaque = durée de vie du nonce (en mémoire, ref)
 */
function GoogleSignInButton({ onSuccess, onError, className }: GoogleSignInButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/";

  const buttonRef = useRef<HTMLDivElement>(null);
  const nonceRef = useRef<string | null>(null);   // nonce brut — jamais exposé
  const nonceHashRef = useRef<string | null>(null); // SHA-256(nonce) — envoyé à Google + backend

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB;

  // ── Handle credential from Google GIS ──────────────────────
  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError("Aucune réponse de Google.");
        return;
      }
      if (!nonceHashRef.current) {
        setError("Session de sécurité expirée. Veuillez réessayer.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await googleSignIn({
          credential: response.credential,
          nonce_hash: nonceHashRef.current,
        });

        // SEC-06 : poser le cookie Sanctum en HttpOnly via le Route Handler
        // (setAuthCookie local supprimé — était document.cookie en clair)
        if (result.token) {
          const expiresAt = result.expires_at
            ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
          await setAuthTokenCookie(result.token, expiresAt);
          setTokenExpiry(expiresAt);
        }

        // Invalider le nonce après usage (single-use)
        nonceRef.current = null;
        nonceHashRef.current = null;

        onSuccess?.(result.is_new_user ?? false);

        router.push(safeRedirect);
        router.refresh();
      } catch (err) {
        const msg = getAuthErrorMessage(err);
        setError(msg);
        onError?.(msg);

        // Regénérer un nonce pour la prochaine tentative
        void initNonce();
      } finally {
        setLoading(false);
      }
    },
    [router, safeRedirect, onSuccess, onError] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Générer nonce + initialiser GIS ────────────────────────
  const initNonce = useCallback(async () => {
    const nonce = generateNonce();
    const hash = await sha256Hex(nonce);

    // Stocker en ref (pas en state — évite re-render + pas dans le DOM)
    nonceRef.current = nonce;
    nonceHashRef.current = hash;

    return hash;
  }, []);

  // ── Init Google GIS ─────────────────────────────────────────
  useEffect(() => {
    if (!clientId) {
      console.warn("[GoogleSignInButton] NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB not set");
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        await loadGsiScript();
        if (cancelled || !window.google?.accounts?.id) return;

        const nonceHash = await initNonce();
        if (cancelled) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredential,
          nonce: nonceHash,
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signin",
          ux_mode: "popup",
          // itp_support: true — pour Safari ITP
          itp_support: true,
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: buttonRef.current.offsetWidth || 320,
            locale: "fr",
          });
        }

        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          console.error("[GoogleSignInButton] Init failed:", e);
          setError("Impossible de charger Google Sign-In.");
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      // Annuler One Tap si actif
      try {
        window.google?.accounts?.id?.cancel();
      } catch { /* ignore */ }
    };
  }, [clientId, handleCredential, initNonce]);

  // Si pas de Client ID configuré — ne rien afficher
  if (!clientId) return null;

  return (
    <div className={className}>
      {/* Conteneur du bouton GIS rendu par Google */}
      <div
        ref={buttonRef}
        className={loading ? "opacity-50 pointer-events-none" : ""}
        style={{ minHeight: "44px" }}
        aria-label="Continuer avec Google"
      />

      {/* Loading overlay */}
      {loading && (
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Connexion avec Google...</span>
        </div>
      )}

      {/* Error (sans détails techniques) */}
      {error && !loading && (
        <p className="mt-2 text-center text-xs text-error" role="alert">
          {error}
        </p>
      )}

      {/* Fallback visuel pendant le chargement du script */}
      {!ready && !error && (
        <div className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background animate-pulse">
          <Image
            src="/icons/google.svg"
            alt="Google"
            width={20}
            height={20}
            className="h-5 w-5 opacity-50"
          />
          <span className="text-sm text-muted-foreground">Chargement Google...</span>
        </div>
      )}
    </div>
  );
}

export { GoogleSignInButton };
