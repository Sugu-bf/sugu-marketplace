import type { CountryCode, SocialProvider } from "../models/auth";

// ─── Country codes ───────────────────────────────────────────
export const mockCountryCodes: CountryCode[] = [
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "États-Unis" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "France" },
  { code: "BF", dialCode: "+226", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "CI", dialCode: "+225", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "SN", dialCode: "+221", flag: "🇸🇳", name: "Sénégal" },
  { code: "ML", dialCode: "+223", flag: "🇲🇱", name: "Mali" },
  { code: "GH", dialCode: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "NG", dialCode: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "Royaume-Uni" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Canada" },
];

// ─── Social providers config ─────────────────────────────────
export interface SocialProviderConfig {
  id: SocialProvider;
  label: string;
  iconPath: string;
}

export const mockSocialProviders: SocialProviderConfig[] = [
  {
    id: "meta",
    label: "Sign in with Meta",
    iconPath: "/icons/meta.svg",
  },
  {
    id: "google",
    label: "Sign in with Google",
    iconPath: "/icons/google.svg",
  },
];

// ─── Mock verification data ──────────────────────────────────
export const mockVerificationEmail = "georgia.young@example.com";
export const mockVerificationPhone = "+1 (555) 000-0545";
