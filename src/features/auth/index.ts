// ─── Models ──────────────────────────────────────────────────
export {
  AuthMethodSchema,
  LoginSchema,
  LoginEmailSchema,
  LoginPhoneSchema,
  OtpVerificationSchema,
  SocialProviderSchema,
  CountryCodeSchema,
  RegisterSchema,
  UserSchema,
} from "./models/auth";

export type {
  AuthMethod,
  LoginInput,
  LoginEmailInput,
  LoginPhoneInput,
  OtpVerificationInput,
  SocialProvider,
  CountryCode,
  RegisterInput,
  User,
} from "./models/auth";

// ─── Queries ─────────────────────────────────────────────────
export {
  queryCountryCodes,
  querySocialProviders,
  queryDefaultCountryCode,
  queryVerificationDestination,
} from "./queries/auth-queries";

// ─── Services ────────────────────────────────────────────────
export {
  loginUser,
  registerUser,
  verifyOtp,
  verifyPhone,
  resendOtp,
  forgotPassword,
  forgotPasswordByPhone,
  resetPassword,
  sendPhoneOtp,
  guestEntry,
  getAuthErrorMessage,
  OTP_TYPE,
} from "./services/auth-service";

export type {
  LoginParams,
  RegisterParams,
  VerifyOtpParams,
  VerifyPhoneParams,
  SendPhoneOtpParams,
  ResendOtpParams,
  ResetPasswordParams,
  GuestEntryResult,
  AuthUserProfile,
} from "./services/auth-service";

// ─── Mocks (types only for re-export) ────────────────────────
export type { SocialProviderConfig } from "./mocks/auth";
