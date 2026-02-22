// ─── Branding API types ──────────────────────────────────────
// Matches the `branding` section of /api/v1/public/marketplace-config

export interface BrandingSite {
  name: string;
  tagline: string | null;
  support_email: string | null;
  support_phone: string | null;
}

export interface BrandingLogos {
  light_url: string | null;
  dark_url: string | null;
  footer_url: string | null;
  favicon_url: string | null;
  apple_touch_icon_url: string | null;
}

export interface BrandingColors {
  primary: string;
  secondary: string | null;
  accent: string | null;
  background: string | null;
  text: string | null;
}

export interface BrandingTypography {
  font_family: string;
  heading_font_family: string | null;
  base_font_size: number | null;
}

export interface BrandingLegalLinks {
  privacy_policy: string | null;
  terms_of_service: string | null;
  refund_policy: string | null;
}

export interface BrandingLinks {
  social: Array<{ platform: string; url: string }>;
  footer: Array<{ title: string; links: Array<{ label: string; url: string }> }>;
  legal: BrandingLegalLinks;
}

export interface BrandingAnnouncement {
  enabled: boolean;
  text: string | null;
  link: string | null;
}

export interface BrandingUI {
  show_vendor_badges: boolean;
}

export interface BrandingData {
  site: BrandingSite;
  logos: BrandingLogos;
  colors: BrandingColors;
  typography: BrandingTypography;
  links: BrandingLinks;
  announcement: BrandingAnnouncement;
  ui: BrandingUI;
}

export interface MarketplaceConfig {
  platform: Record<string, unknown>;
  branding: BrandingData;
  localization: Record<string, unknown>;
  header: Record<string, unknown>;
  footer: Record<string, unknown>;
  catalog: Record<string, unknown>;
  meta: {
    version: number;
    generated_at: string;
    cache_ttl: number;
  };
}
