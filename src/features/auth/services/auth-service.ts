/**
 * Auth Service — handles all auth API calls to the Laravel backend.
 *
 * Register accepte email OU téléphone (plus besoin des deux).
 * Backend: /api/v1/web-auth/*
 */

import { api } from "@/lib/api/client";
import { buildApiUrl } from "@/lib/api/endpoints";
import { initCsrf } from "@/lib/api/auth";
import { ApiError, isApiError } from "@/lib/api/errors";

// ─── OTP Types (matching backend OtpType enum) ──────────────
export const OTP_TYPE = {
  EMAIL_VERIFICATION: 1,
  PHONE_VERIFICATION: 2,
  LOGIN_VERIFICATION: 3,
  PASSWORD_RESET: 4,
} as const;

// ─── Response Types ──────────────────────────────────────────

export interface AuthUserProfile {
  id: string;
  name: string;
  email: string | null;
  phone_e164: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  status: string;
  user_type: string;
  user_type_label: string;
  can_sell: boolean;
  can_buy: boolean;
  can_create_store: boolean;
  referral_code: string;
  roles: string[];
  store?: {
    id: string;
    name: string;
    logo_url: string | null;
    slug: string;
  } | null;
  agency?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  created_at: string;
  updated_at: string;
}

interface ApiSuccessResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

interface LoginSuccessData {
  user: AuthUserProfile;
  token: string;
}

interface LoginOtpData {
  verification_required: boolean;
  identifier: string;
  expires_in: number;
}

interface RegisterSuccessData {
  user: AuthUserProfile;
  token: string;
  verification_required: {
    email: boolean;
    phone: boolean;
  };
}

interface ForgotPasswordData {
  identifier: string;
  expires_in: number;
}

// ─── Cookie helpers ────────────────────────────────────────────

/** Durée de vie du token : 90 jours en secondes */
const TOKEN_MAX_AGE = 90 * 24 * 60 * 60;

/**
 * Stocker le token Sanctum dans le cookie `auth_token`.
 *
 * STRATÉGIE DOUBLE :
 * 1. document.cookie direct (primaire) — immédiat et fiable.
 *    Nécessaire : l'API Laravel utilise uniquement Authorization: Bearer
 *    (pas le mode cookie stateful de Sanctum — incompatible cross-domain).
 *    client.ts lit `auth_token` depuis document.cookie → Bearer header.
 *
 * 2. Route Handler /api/auth/set-session (secondaire, async) — bonus SSR.
 *    Si le Route Handler échoue, le cookie JS suffira pour le client.
 *    On ne bloque PAS la navigation sur ce call.
 *
 * NOTE sécurité CSRF : cookie SameSite=Lax + Bearer token.
 * Un attaquant cross-domain ne peut pas forger Authorization: Bearer.
 */
export function setAuthTokenCookie(token: string, expiresAt?: string): void {
  if (typeof document === "undefined") return;

  const isHttps = window.location.protocol === "https:";
  const secure  = isHttps ? "; Secure" : "";

  // ── 1. Cookie direct (synchrone — garanti avant navigation) ──
  document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE}; SameSite=Lax${secure}`;

  // ── 2. Route Handler en arrière-plan (pour SSR cookie) ────────
  const expiresAtStr = expiresAt ?? new Date(Date.now() + TOKEN_MAX_AGE * 1000).toISOString();
  document.cookie = `auth_token_expires_at=${encodeURIComponent(expiresAtStr)}; path=/; max-age=${TOKEN_MAX_AGE}; SameSite=Lax${secure}`;

  // Appel async non-bloquant au Route Handler (pour le rendu SSR)
  fetch("/api/auth/set-session", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ token, expires_at: expiresAtStr }),
  }).catch(() => {
    // Non bloquant — le cookie JS est déjà posé, auth client OK
  });
}

/**
 * Vérifier si l'user a un token en cookie.
 * Lit directement auth_token depuis document.cookie.
 */
export function getAuthTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

/** Stocker la date d'expiration en localStorage (pour useTokenRefresh) */
export function setTokenExpiry(expiresAt: string): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("auth_token_expires_at", expiresAt);
  }
}

/** Lire la date d'expiration du token */
export function getTokenExpiry(): Date | null {
  if (typeof localStorage === "undefined") return null;
  const val = localStorage.getItem("auth_token_expires_at");
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/** Nombre de jours restants avant expiration du token */
export function tokenDaysRemaining(): number {
  const expiry = getTokenExpiry();
  if (!expiry) return 0;
  return Math.floor((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** Déconnecter : efface le cookie */
export function clearAuthTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "auth_token_expires_at=; path=/; max-age=0; SameSite=Lax";
  // Nettoyage via Route Handler (supprime le cookie côté serveur aussi)
  fetch("/api/auth/set-session", { method: "DELETE" }).catch(() => {});
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("auth_token_expires_at");
  }
}

// ─── Refresh Token (zéro SMS) ────────────────────────────────

export async function refreshToken(): Promise<{ token: string; expires_at: string }> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse<{ token: string; expires_at: string; ttl_days: number }>>(
    buildApiUrl("/api/v1/web-auth/refresh-token"),
    {}
  );

  if (!data.success || !data.data) {
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: data.message || "Session expirée." });
  }

  // Mettre à jour le cookie HttpOnly + expiry
  await setAuthTokenCookie(data.data.token, data.data.expires_at);
  setTokenExpiry(data.data.expires_at);

  return data.data;
}

// ─── Check Phone (Smart Login) ───────────────────────────────
// Étape 1 du login téléphone : vérifie si le numéro existe
// et retourne la méthode d'auth disponible

export interface CheckPhoneResult {
  exists: boolean;
  /** "pin" = l'user a un PIN, "otp" = compte Google (pas de PIN), null = n'existe pas */
  auth_method: "pin" | "otp" | null;
  /** true = vendeur/agence → rediriger vers pro.sugu.pro */
  redirect_to_pro: boolean;
}

export async function checkPhone(phone_e164: string): Promise<CheckPhoneResult> {
  const { data } = await api.post<ApiSuccessResponse<CheckPhoneResult>>(
    buildApiUrl("/api/v1/web-auth/check-phone"),
    { body: { phone_e164 } }
  );

  if (!data.success || !data.data) {
    throw new ApiError({ status: 422, code: "VALIDATION_ERROR", message: data.message || "Numéro invalide." });
  }

  return data.data;
}

// ─── Login ───────────────────────────────────────────────────

export interface LoginParams {
  login_field: string; // email or phone E.164
  password: string;
}

export async function loginUser(params: LoginParams): Promise<{
  type: "success";
  user: AuthUserProfile;
  token: string;
} | {
  type: "otp_required";
  identifier: string;
  expires_in: number;
}> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse<LoginSuccessData | LoginOtpData>>(
    buildApiUrl("/api/v1/web-auth/login"),
    { body: params }
  );

  const resp = data;

  if (!resp.success) {
    throw new ApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: resp.message || "Identifiants invalides.",
    });
  }

  const d = resp.data!;

  if ("verification_required" in d && d.verification_required) {
    return {
      type: "otp_required",
      identifier: (d as LoginOtpData).identifier,
      expires_in: (d as LoginOtpData).expires_in,
    };
  }

  const loginData = d as LoginSuccessData;
  return {
    type: "success",
    user: loginData.user,
    token: loginData.token,
  };
}

// ─── Register ────────────────────────────────────────────────

export interface RegisterParams {
  name: string;
  /** Obligatoire si méthode email */
  email?: string;
  /** Obligatoire si méthode téléphone */
  phone_e164?: string;
  /** PIN 4 chiffres — méthode téléphone (remplacé password) */
  pin?: string;
  /** Mot de passe ≥8 chars — méthode email uniquement */
  password?: string;
  password_confirmation?: string;
  /** Toujours "buyer" sur la marketplace. Les vendeurs ont pro.sugu.pro */
  user_type?: "buyer";
  referral_code?: string;
  /** SEC-01 : token OTP SMS one-use (30 min) — obligatoire si inscription par téléphone */
  phone_verified_token?: string;
}

export async function registerUser(params: RegisterParams): Promise<{
  user: AuthUserProfile;
  token: string;
  verification_required: { email: boolean; phone: boolean };
}> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse<RegisterSuccessData>>(
    buildApiUrl("/api/v1/web-auth/register"),
    { body: params }
  );

  if (!data.success) {
    throw new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: data.message || "Erreur lors de l'inscription.",
    });
  }

  return data.data!;
}

// ─── Send Phone OTP (SMS via Ikoddi) ─────────────────────────

export interface SendPhoneOtpParams {
  phone_e164: string;
}

export async function sendPhoneOtp(paramsOrPhone: SendPhoneOtpParams | string): Promise<{
  cooldown_seconds: number;
  expires_in: number;
}> {
  const body = typeof paramsOrPhone === "string"
    ? { phone_e164: paramsOrPhone }
    : paramsOrPhone;

  const { data } = await api.post<ApiSuccessResponse<{ cooldown_seconds: number; expires_in: number }>>(
    buildApiUrl("/api/v1/web-auth/send-otp"),
    { body }
  );

  if (!data.success) {
    throw new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: data.message || "Erreur lors de l'envoi du SMS.",
    });
  }

  return data.data ?? { cooldown_seconds: 60, expires_in: 300 };
}

// ─── Verify Phone OTP ────────────────────────────────────────

export interface VerifyPhoneParams {
  phone_e164: string;
  code: string;
}

export async function verifyPhone(params: VerifyPhoneParams): Promise<{
  verified: boolean;
  /** SEC-01 : token one-use à envoyer lors du POST /register */
  verified_token?: string;
  user?: AuthUserProfile;
}> {
  const { data } = await api.post<ApiSuccessResponse<{ verified: boolean; verified_token?: string; user?: AuthUserProfile }>>(
    buildApiUrl("/api/v1/web-auth/verify-phone"),
    { body: params }
  );

  if (!data.success) {
    throw new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: data.message || "Code invalide.",
    });
  }

  return {
    verified: true,
    verified_token: data.data?.verified_token,
    user: data.data?.user,
  };
}

// ─── Verify OTP (email or phone, general) ────────────────────

export interface VerifyOtpParams {
  identifier: string;
  code: string;
  type: number;
}

export async function verifyOtp(params: VerifyOtpParams): Promise<{
  verified: boolean;
  user?: AuthUserProfile;
  token?: string;
  expires_at?: string;
}> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse<{
    verified?: boolean;
    type?: string;
    user?: AuthUserProfile;
    token?: string;
    expires_at?: string;
  }>>(
    buildApiUrl("/api/v1/web-auth/verify-otp"),
    { body: params }
  );

  if (!data.success) {
    throw new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: data.message || "Code invalide.",
    });
  }

  return {
    verified: true,
    user: data.data?.user,
    token: data.data?.token,
    expires_at: data.data?.expires_at,
  };
}

// ─── Resend OTP ──────────────────────────────────────────────

export interface ResendOtpParams {
  identifier: string;
  type: number;
}

export async function resendOtp(params: ResendOtpParams): Promise<{
  expires_in: number;
}> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse<{ expires_in: number }>>(
    buildApiUrl("/api/v1/web-auth/resend-otp"),
    { body: params }
  );

  if (!data.success) {
    throw new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: data.message || "Impossible de renvoyer le code.",
    });
  }

  return data.data!;
}

// ─── Forgot Password (email) ────────────────────────────────

export async function forgotPassword(email: string): Promise<ForgotPasswordData> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse<ForgotPasswordData>>(
    buildApiUrl("/api/v1/web-auth/forgot-password"),
    { body: { email } }
  );

  if (!data.success) {
    throw new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: data.message || "Erreur.",
    });
  }

  return data.data!;
}

// ─── Forgot Password by Phone (SMS) ─────────────────────────

export async function forgotPasswordByPhone(phone_e164: string): Promise<ForgotPasswordData> {
  const { data } = await api.post<ApiSuccessResponse<ForgotPasswordData>>(
    buildApiUrl("/api/v1/web-auth/forgot-password-phone"),
    { body: { phone_e164 } }
  );

  if (!data.success) {
    throw new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: data.message || "Erreur.",
    });
  }

  return data.data!;
}

// ─── Reset Password ─────────────────────────────────────────

export interface ResetPasswordParams {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
}

export async function resetPassword(params: ResetPasswordParams): Promise<string> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse>(
    buildApiUrl("/api/v1/web-auth/reset-password"),
    { body: params }
  );

  if (!data.success) {
    throw new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: data.message || "Erreur lors de la réinitialisation.",
    });
  }

  return data.message;
}

// ─── Guest Entry ─────────────────────────────────────────────

export interface GuestEntryResult {
  token: string;
  user: AuthUserProfile;
}

export async function guestEntry(): Promise<GuestEntryResult> {
  const { data } = await api.post<ApiSuccessResponse<GuestEntryResult>>(
    buildApiUrl("/api/v1/web-auth/guest"),
    { body: {} }
  );

  const result = data?.data;
  if (!result?.token) {
    throw new Error("Erreur lors de la création du compte invité.");
  }

  return result;
}

// ─── Google Sign-In ───────────────────────────────────────────

export interface GoogleSignInParams {
  /** Google ID token (credential) retourné par GIS */
  credential: string;
  /** SHA-256 du nonce généré par le frontend — jamais le nonce brut */
  nonce_hash: string;
}

export interface GoogleSignInResult {
  user: AuthUserProfile;
  token: string;
  /** ISO 8601 — date d'expiration du token Sanctum (90j par défaut) */
  expires_at?: string;
  is_new_user: boolean;
}

/**
 * Google Sign-In pour le web.
 *
 * SÉCURITÉ :
 * - Le credential (Google ID token) n'est JAMAIS stocké — envoyé directement au backend
 * - Le nonce_hash est SHA-256(nonce), pas le nonce brut
 * - Le backend valide : JWK signature, aud, iss, iat <= 5min, email_verified, nonce
 */
export async function googleSignIn(
  params: GoogleSignInParams
): Promise<GoogleSignInResult> {
  const { data } = await api.post<ApiSuccessResponse<GoogleSignInResult>>(
    buildApiUrl("/api/v1/web-auth/google"),
    { body: params, retries: 0 }
  );

  const result = data?.data;
  if (!result?.token) {
    throw new Error("Réponse Google invalide du serveur.");
  }

  return result;
}

// ─── Helper: extract error message ──────────────────────────

export function getAuthErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.details?.errors) {
      const fieldErrors = error.details.errors as Record<string, string[]>;
      const firstField = Object.keys(fieldErrors)[0];
      if (firstField && fieldErrors[firstField]?.[0]) {
        return fieldErrors[firstField][0];
      }
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Une erreur inattendue est survenue.";
}
