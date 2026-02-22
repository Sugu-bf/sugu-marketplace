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

// ─── Mocks (types only for re-export) ────────────────────────
export type { SocialProviderConfig } from "./mocks/auth";
