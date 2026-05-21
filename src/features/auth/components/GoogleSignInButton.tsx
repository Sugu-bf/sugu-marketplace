"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import {
  googleSignIn,
  getAuthErrorMessage,
  safeRelativePath,
  setTokenExpiry,
} from "../services/auth-service";

// ─── Types ─────────────────────────────────────────────────

interface GoogleSignInButtonProps {
  /** Called after success. The BFF has already established the HttpOnly session. */
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
 * Génère un nonce-hash unique pour cette session de signature.
 *
 * SÉCURITÉ : On envoie le HASH (jamais le nonce brut) à Google, qui l'embarque
 * dans le credential JWT. Le backend recompare token.nonce ↔ nonce_hash reçu.
 *
 * Implémentation : SHA-256 d'un UUID CSPRNG via Web Crypto.
 *
 * Le nonce brut n'est utile à PERSONNE après le hash (ni le client, ni Google,
 * ni le backend ne le verront jamais) — on ne le conserve pas en mémoire.
 */
async function generateNonceHash(): Promise<string> {
  const raw = crypto.randomUUID();
  const data = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

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
  const searchParams = useSearchParams();
  // Open-redirect defence (safeRelativePath bloque `//evil.com`, `/\evil`, …)
  const safeRedirect = safeRelativePath(searchParams.get("redirect"));

  const buttonRef = useRef<HTMLDivElement>(null);
  // Le nonce_hash courant. STABLE pour toute la vie du composant : il est
  // initialisé une fois, passé à Google via .initialize(), puis utilisé lors
  // de chaque tentative. Régénérer le hash sans réinitialiser Google créerait
  // un mismatch (Google embarque l'ancien hash dans le token, on enverrait
  // le nouveau au backend) → blocage en boucle après la première erreur.
  const nonceHashRef = useRef<string | null>(null);

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

        // The BFF stripped the token and set the HttpOnly session cookie.
        if (result.expires_at) setTokenExpiry(result.expires_at);

        // Sur succès, le composant va être démonté par la navigation — pas
        // besoin d'invalider le ref manuellement.
        onSuccess?.(result.is_new_user ?? false);

        // Hard navigation → force rechargement complet du navigateur
        // Nécessaire : le Header fait checkAuth() uniquement au mount.
        window.location.href = safeRedirect;
      } catch (err) {
        const msg = getAuthErrorMessage(err);
        setError(msg);
        onError?.(msg);
        // NB : on NE régénère PAS le nonce_hash ici. Google reste initialisé
        // avec le hash courant — un nouveau clic produit un credential dont
        // le nonce match toujours. Régénérer cassait le retry (le credential
        // suivant aurait l'ancien nonce mais on enverrait le nouveau hash).
        // Si la session traîne au-delà de 5 min, le backend renverra "token
        // trop ancien" → l'utilisateur recharge la page et un nouveau nonce
        // est généré au remount.
      } finally {
        setLoading(false);
      }
    },
    [safeRedirect, onSuccess, onError]
  );

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

        const nonceHash = await generateNonceHash();
        if (cancelled) return;
        // Le hash est stocké pour être renvoyé au backend lors de l'échange
        // — c'est ce que Google va embarquer dans le credential JWT.
        nonceHashRef.current = nonceHash;

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
  }, [clientId, handleCredential]);

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
