/**
 * Auth Service — handles all auth API calls to the Laravel backend.
 *
 * All OTPs are sent by email from the backend.
 * Backend expects:
 *  - login:    { login_field, password, require_otp? }
 *  - register: { name, email, phone_e164, password, password_confirmation, user_type }
 *  - verify-otp: { identifier, code (6 digits), type (int) }
 *  - resend-otp: { identifier, type (int) }
 *  - forgot-password: { email }
 *  - reset-password: { email, code, password, password_confirmation }
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
  email: string;
  phone_e164: string;
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

  // Check if OTP verification is required
  if ("verification_required" in d && d.verification_required) {
    return {
      type: "otp_required",
      identifier: (d as LoginOtpData).identifier,
      expires_in: (d as LoginOtpData).expires_in,
    };
  }

  // Direct login success
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
  email: string;
  phone_e164: string;
  password: string;
  password_confirmation: string;
  user_type: "buyer" | "seller" | "both";
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

// ─── Verify OTP ──────────────────────────────────────────────

export interface VerifyOtpParams {
  identifier: string;
  code: string;
  type: number;
}

export async function verifyOtp(params: VerifyOtpParams): Promise<{
  verified: boolean;
  user?: AuthUserProfile;
  token?: string;
}> {
  await initCsrf();

  const { data } = await api.post<ApiSuccessResponse<{
    verified?: boolean;
    type?: string;
    user?: AuthUserProfile;
    token?: string;
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

// ─── Forgot Password ────────────────────────────────────────

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

// ─── Helper: extract error message ──────────────────────────

export function getAuthErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    // Check for field-level validation errors
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
