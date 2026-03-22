import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * SEC-06 — Cookie HttpOnly pour le token Sanctum
 *
 * AVANT : token stocké dans document.cookie (lisible JS → XSS = vol instant)
 * APRÈS : cookie posé server-side par cette route → HttpOnly → invisible JS
 *
 * POST /api/auth/set-session  → pose le cookie auth_token HttpOnly
 * DELETE /api/auth/set-session → efface le cookie (logout)
 */

const TOKEN_MAX_AGE = 60 * 60 * 24 * 90; // 90 jours
const IS_PROD       = process.env.NODE_ENV === "production";

/** Validation basique du token Sanctum (format: \d+|<hash64chars>) */
function isValidTokenFormat(token: unknown): token is string {
  if (typeof token !== "string") return false;
  // Sanctum plainTextToken : "<id>|<random_string>" — id numérique + | + alphanum
  return /^\d+\|[A-Za-z0-9]{40,}$/.test(token);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, expires_at } = body;

    if (!isValidTokenFormat(token)) {
      return NextResponse.json({ success: false, message: "Token invalide." }, { status: 400 });
    }

    // ARCHITECTURE NOTE : cookie intentionnellement NON-HttpOnly
    // L'API Laravel (api.mysugu.com) utilise UNIQUEMENT Authorization: Bearer,
    // pas le mode cookie stateful de Sanctum (incompatible cross-domain).
    // Le client.ts doit pouvoir lire auth_token depuis document.cookie
    // pour construire le header Authorization: Bearer à chaque requête.
    //
    // Sécurité CSRF : garantie par Bearer token + CORS strict (sugu.pro → api.mysugu.com).
    // Un attaquant cross-origin ne peut pas forger Authorization: Bearer depuis un
    // site tiers — c'est une protection équivalente à CSRF token pour les SPA.
    //
    // X-Source de système : le token Sanctum a une durée de vie (90j) et peut
    // être révoqué côté backend à tout instant (table personal_access_tokens).

    const cookieStore = await cookies();

    // auth_token : lisible par JS (non-HttpOnly) — nécessaire pour Bearer token
    cookieStore.set("auth_token", token, {
      httpOnly: false,           // ← Volontaire : doit être lu par client.ts pour Bearer
      secure:   IS_PROD,        // HTTPS only en production
      sameSite: "lax",          // Protège CSRF sans casser navigation normale
      maxAge:   TOKEN_MAX_AGE,
      path:     "/",
    });

    // expires_at : visible JS (non sensible) — utilisé par useTokenRefresh
    if (expires_at && typeof expires_at === "string") {
      cookieStore.set("auth_token_expires_at", expires_at, {
        httpOnly: false,
        secure:   IS_PROD,
        sameSite: "lax",
        maxAge:   TOKEN_MAX_AGE,
        path:     "/",
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("auth_token_expires_at");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
