import type { CountryCode, SocialProvider } from "../models/auth";

// ─── Pays africains uniquement ───────────────────────────────
// Afrique de l'Ouest en tête (marché principal Sugu), puis reste Afrique par zone.
export const mockCountryCodes: CountryCode[] = [
  // ── Afrique de l'Ouest (priorité Sugu) ──────────────────
  { code: "BF", dialCode: "+226", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "CI", dialCode: "+225", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "SN", dialCode: "+221", flag: "🇸🇳", name: "Sénégal" },
  { code: "ML", dialCode: "+223", flag: "🇲🇱", name: "Mali" },
  { code: "GN", dialCode: "+224", flag: "🇬🇳", name: "Guinée" },
  { code: "NE", dialCode: "+227", flag: "🇳🇪", name: "Niger" },
  { code: "TG", dialCode: "+228", flag: "🇹🇬", name: "Togo" },
  { code: "BJ", dialCode: "+229", flag: "🇧🇯", name: "Bénin" },
  { code: "MR", dialCode: "+222", flag: "🇲🇷", name: "Mauritanie" },
  { code: "GW", dialCode: "+245", flag: "🇬🇼", name: "Guinée-Bissau" },
  { code: "SL", dialCode: "+232", flag: "🇸🇱", name: "Sierra Leone" },
  { code: "LR", dialCode: "+231", flag: "🇱🇷", name: "Libéria" },
  { code: "GM", dialCode: "+220", flag: "🇬🇲", name: "Gambie" },
  { code: "CV", dialCode: "+238", flag: "🇨🇻", name: "Cap-Vert" },
  { code: "GH", dialCode: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "NG", dialCode: "+234", flag: "🇳🇬", name: "Nigeria" },
  // ── Afrique Centrale ─────────────────────────────────────
  { code: "CM", dialCode: "+237", flag: "🇨🇲", name: "Cameroun" },
  { code: "CD", dialCode: "+243", flag: "🇨🇩", name: "RD Congo" },
  { code: "CG", dialCode: "+242", flag: "🇨🇬", name: "Congo" },
  { code: "GA", dialCode: "+241", flag: "🇬🇦", name: "Gabon" },
  { code: "CF", dialCode: "+236", flag: "🇨🇫", name: "Centrafrique" },
  { code: "TD", dialCode: "+235", flag: "🇹🇩", name: "Tchad" },
  { code: "GQ", dialCode: "+240", flag: "🇬🇶", name: "Guinée équatoriale" },
  { code: "ST", dialCode: "+239", flag: "🇸🇹", name: "São Tomé-et-Príncipe" },
  // ── Afrique de l'Est ──────────────────────────────────────
  { code: "ET", dialCode: "+251", flag: "🇪🇹", name: "Éthiopie" },
  { code: "KE", dialCode: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "TZ", dialCode: "+255", flag: "🇹🇿", name: "Tanzanie" },
  { code: "UG", dialCode: "+256", flag: "🇺🇬", name: "Ouganda" },
  { code: "RW", dialCode: "+250", flag: "🇷🇼", name: "Rwanda" },
  { code: "BI", dialCode: "+257", flag: "🇧🇮", name: "Burundi" },
  { code: "SO", dialCode: "+252", flag: "🇸🇴", name: "Somalie" },
  { code: "DJ", dialCode: "+253", flag: "🇩🇯", name: "Djibouti" },
  { code: "ER", dialCode: "+291", flag: "🇪🇷", name: "Érythrée" },
  { code: "MW", dialCode: "+265", flag: "🇲🇼", name: "Malawi" },
  { code: "MZ", dialCode: "+258", flag: "🇲🇿", name: "Mozambique" },
  { code: "ZM", dialCode: "+260", flag: "🇿🇲", name: "Zambie" },
  { code: "ZW", dialCode: "+263", flag: "🇿🇼", name: "Zimbabwe" },
  { code: "MG", dialCode: "+261", flag: "🇲🇬", name: "Madagascar" },
  { code: "KM", dialCode: "+269", flag: "🇰🇲", name: "Comores" },
  { code: "SC", dialCode: "+248", flag: "🇸🇨", name: "Seychelles" },
  { code: "MU", dialCode: "+230", flag: "🇲🇺", name: "Maurice" },
  // ── Afrique du Nord ───────────────────────────────────────
  { code: "MA", dialCode: "+212", flag: "🇲🇦", name: "Maroc" },
  { code: "DZ", dialCode: "+213", flag: "🇩🇿", name: "Algérie" },
  { code: "TN", dialCode: "+216", flag: "🇹🇳", name: "Tunisie" },
  { code: "LY", dialCode: "+218", flag: "🇱🇾", name: "Libye" },
  { code: "EG", dialCode: "+20",  flag: "🇪🇬", name: "Égypte" },
  { code: "SD", dialCode: "+249", flag: "🇸🇩", name: "Soudan" },
  { code: "SS", dialCode: "+211", flag: "🇸🇸", name: "Soudan du Sud" },
  // ── Afrique Australe ──────────────────────────────────────
  { code: "ZA", dialCode: "+27",  flag: "🇿🇦", name: "Afrique du Sud" },
  { code: "NA", dialCode: "+264", flag: "🇳🇦", name: "Namibie" },
  { code: "BW", dialCode: "+267", flag: "🇧🇼", name: "Botswana" },
  { code: "LS", dialCode: "+266", flag: "🇱🇸", name: "Lesotho" },
  { code: "SZ", dialCode: "+268", flag: "🇸🇿", name: "Eswatini" },
  { code: "AO", dialCode: "+244", flag: "🇦🇴", name: "Angola" },
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
