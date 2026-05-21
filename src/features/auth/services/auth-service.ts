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
import {
  AUTH_TOKEN_EXPIRES_COOKIE,
} from "@/lib/api/session";

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
  expires_at?: string;
}

interface LoginOtpData {
  verification_required: boolean;
  identifier: string;
  expires_in: number;
}

interface RegisterSuccessData {
  user: AuthUserProfile;
  expires_at?: string;
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

/** Read a non-sensitive browser cookie value. */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

export function hasAuthSession(): boolean {
  return getTokenExpiry() !== null;
}

/** Stocker la date d'expiration en localStorage (pour useTokenRefresh) */
export function setTokenExpiry(expiresAt: string): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("auth_token_expires_at", expiresAt);
  }
}

/** Lire la date d'expiration du token */
export function getTokenExpiry(): Date | null {
  const val = typeof localStorage !== "undefined"
    ? localStorage.getItem("auth_token_expires_at") ?? readCookie(AUTH_TOKEN_EXPIRES_COOKIE)
    : readCookie(AUTH_TOKEN_EXPIRES_COOKIE);
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
export async function clearAuthTokenCookie(): Promise<void> {
  // Nettoyage via Route Handler (supprime le cookie côté serveur aussi)
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("auth_token_expires_at");
  }

  if (typeof window === "undefined") return;

  await fetch("/api/auth/set-session", {
    method: "DELETE",
    credentials: "same-origin",
  }).catch(() => {});
}

// ─── Refresh Token (zéro SMS) ────────────────────────────────

export async function refreshToken(): Promise<{ expires_at: string }> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse<{ expires_at: string; ttl_days?: number }>>(
    buildApiUrl("/api/v1/web-auth/refresh-token"),
    {}
  );

  if (!data.success || !data.data?.expires_at) {
    throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: data.message || "Session expirée." });
  }

  // The BFF rotates the HttpOnly cookie server-side. JavaScript keeps only the
  // non-sensitive expiry hint for refresh scheduling.
  setTokenExpiry(data.data.expires_at);

  return { expires_at: data.data.expires_at };
}

// ─── Check Phone (Smart Login) ───────────────────────────────
// Étape 1 du login téléphone : vérifie si le numéro existe.
// Le PIN n'existe plus — l'auth téléphone est TOUJOURS par OTP.
// La redirection pro est désormais décidée APRÈS login, depuis le profil
// (user_type / roles) — l'endpoint ne fuite plus le rôle avant auth.

export interface CheckPhoneResult {
  exists: boolean;
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
  expires_at?: string;
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
    expires_at: loginData.expires_at,
  };
}

// ─── Register ────────────────────────────────────────────────

export interface RegisterParams {
  name: string;
  /** Méthode email — sur le portail acheteur on n'utilise pas cette méthode. */
  email?: string;
  /** Méthode téléphone (par défaut sur la marketplace) */
  phone_e164?: string;
  /** Toujours "buyer" sur la marketplace. Les vendeurs ont pro.sugu.pro */
  user_type?: "buyer";
  referral_code?: string;
  /**
   * SEC-01 : token OTP SMS one-use (30 min) — OBLIGATOIRE pour l'inscription
   * par téléphone. Prouve la possession du numéro ; le backend marque alors
   * phone_verified_at immédiatement et n'envoie PAS d'OTP supplémentaire.
   */
  phone_verified_token?: string;
}

export async function registerUser(params: RegisterParams): Promise<{
  user: AuthUserProfile;
  expires_at?: string;
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
  expires_at?: string;
}> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse<{
    verified?: boolean;
    type?: string;
    user?: AuthUserProfile;
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
  expires_at?: string;
  user: AuthUserProfile;
}

export async function guestEntry(): Promise<GuestEntryResult> {
  const { data } = await api.post<ApiSuccessResponse<GuestEntryResult>>(
    buildApiUrl("/api/v1/web-auth/guest"),
    { body: {} }
  );

  const result = data?.data;
  if (!result?.user) {
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
  if (!result?.user) {
    throw new Error("Réponse Google invalide du serveur.");
  }

  return result;
}

// ─── Helper: safe relative path (open-redirect defence) ─────
/**
 * Retourne `url` uniquement si c'est un chemin RELATIF interne sûr,
 * sinon retourne `/`. Bloque :
 *   - URLs absolues (http://, https://, javascript:, data:, …)
 *   - URLs protocole-relatif (//evil.com  → équivalent à https://evil.com)
 *   - Slash + backslash (/\evil.com  → certains navigateurs traitent \ comme /)
 *   - Caractères de contrôle (newline, etc. — vecteurs d'injection)
 *
 * Le check `.startsWith("/")` SEUL est insuffisant : il laisse passer
 * `//evil.com` et `/\evil.com`, ce qui devient un redirect ouvert exploitable
 * via `?redirect=//evil.com` après login.
 */
export function safeRelativePath(url: string | null | undefined): string {
  if (typeof url !== "string" || url.length === 0) return "/";
  // Pas de caractères de contrôle (incluant \r \n \t)
  if (/[\x00-\x1F\x7F]/.test(url)) return "/";
  // Doit commencer par '/' et le caractère suivant ne doit être ni '/' ni '\'
  // (un '/' tout seul est accepté = retour accueil).
  if (url === "/") return "/";
  if (/^\/[^/\\]/.test(url)) return url;
  return "/";
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
