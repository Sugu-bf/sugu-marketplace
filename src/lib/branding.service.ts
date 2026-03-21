import type { BrandingData, MarketplaceConfig } from "./branding.types";
import { API_BASE_URL } from "./api/config";

// ─── Configuration ───────────────────────────────────────────
const BRANDING_ENDPOINT = `${API_BASE_URL}/v1/public/marketplace-config`;

/** In-memory cache for SSR deduplication within the same request lifecycle */
let cachedBranding: BrandingData | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes client-side

// ─── Hardcoded fallbacks — NEVER crash if API is down ────────
export const BRANDING_FALLBACK: BrandingData = {
  site: {
    name: "SUGU",
    tagline: "La plus grande plateforme de vente en ligne",
    support_email: "contact@sugu.pro",
    support_phone: "+226 00 00 00 00",
  },
  logos: {
    light_url: "https://cdn.sugu.pro/p/logo-sugu.avif",
    dark_url: "https://cdn.sugu.pro/p/logo-sugu.avif",
    footer_url: "https://cdn.sugu.pro/p/logo-sugu.avif",
    favicon_url: null,
    apple_touch_icon_url: null,
  },
  colors: {
    primary: "#F15412",
    secondary: null,
    accent: "#F5C451",
    background: "#FFFFFF",
    text: "#171717",
  },
  typography: {
    font_family: "Inter",
    heading_font_family: null,
    base_font_size: 16,
  },
  links: {
    social: [],
    footer: [],
    legal: {
      privacy_policy: null,
      terms_of_service: null,
      refund_policy: null,
    },
  },
  announcement: {
    enabled: false,
    text: null,
    link: null,
  },
  ui: {
    show_vendor_badges: false,
  },
};

/**
 * Fetch branding data from the marketplace-config API.
 * - SSR-friendly: uses Next.js fetch with revalidation
 * - Client-side: uses in-memory cache with TTL
 * - NEVER throws: always returns fallback on error
 */
export async function fetchBranding(): Promise<BrandingData> {
  // Client-side cache hit
  if (
    typeof window !== "undefined" &&
    cachedBranding &&
    Date.now() - cachedAt < CACHE_TTL_MS
  ) {
    return cachedBranding;
  }

  try {
    const res = await fetch(BRANDING_ENDPOINT, {
      next: { revalidate: 300 }, // 5 min ISR cache for SSR
      headers: {
        Accept: "application/json",
        "Accept-Language": "fr",
      },
    });

    if (!res.ok) {
      console.warn(`[Branding] API returned ${res.status}, using fallback`);
      return BRANDING_FALLBACK;
    }

    const data: MarketplaceConfig = await res.json();

    if (!data?.branding) {
      console.warn("[Branding] No branding section in response, using fallback");
      return BRANDING_FALLBACK;
    }

    // Merge with fallback to ensure all fields exist
    const branding = deepMergeBranding(BRANDING_FALLBACK, data.branding);

    // Update client-side cache
    cachedBranding = branding;
    cachedAt = Date.now();

    return branding;
  } catch (error) {
    console.warn("[Branding] Fetch failed, using fallback:", error);
    return BRANDING_FALLBACK;
  }
}

/**
 * Deep merge branding data with fallback.
 * API values take precedence; null/undefined fields fall back to defaults.
 */
function deepMergeBranding(
  fallback: BrandingData,
  api: Partial<BrandingData>
): BrandingData {
  return {
    site: {
      name: api.site?.name ?? fallback.site.name,
      tagline: api.site?.tagline ?? fallback.site.tagline,
      support_email: api.site?.support_email ?? fallback.site.support_email,
      support_phone: api.site?.support_phone ?? fallback.site.support_phone,
    },
    logos: { ...fallback.logos, ...(api.logos ?? {}) }, // Keep nulls for logos — they mean "no logo"
    colors: {
      primary: api.colors?.primary ?? fallback.colors.primary,
      secondary: api.colors?.secondary ?? fallback.colors.secondary,
      accent: api.colors?.accent ?? fallback.colors.accent,
      background: api.colors?.background ?? fallback.colors.background,
      text: api.colors?.text ?? fallback.colors.text,
    },
    typography: {
      font_family: api.typography?.font_family ?? fallback.typography.font_family,
      heading_font_family: api.typography?.heading_font_family ?? fallback.typography.heading_font_family,
      base_font_size: api.typography?.base_font_size ?? fallback.typography.base_font_size,
    },
    links: {
      social: api.links?.social ?? fallback.links.social,
      footer: api.links?.footer ?? fallback.links.footer,
      legal: { ...fallback.links.legal, ...(api.links?.legal ?? {}) },
    },
    announcement: { ...fallback.announcement, ...(api.announcement ?? {}) },
    ui: { ...fallback.ui, ...(api.ui ?? {}) },
  };
}

/**
 * Generate CSS custom properties from branding colors.
 * Injected into <html> style for global consumption.
 */
export function brandingToCssVars(branding: BrandingData): string {
  const vars: string[] = [];

  if (branding.colors.primary) {
    vars.push(`--color-branding-primary: ${branding.colors.primary}`);
  }
  if (branding.colors.secondary) {
    vars.push(`--color-branding-secondary: ${branding.colors.secondary}`);
  }
  if (branding.colors.accent) {
    vars.push(`--color-branding-accent: ${branding.colors.accent}`);
  }
  if (branding.colors.background) {
    vars.push(`--color-branding-background: ${branding.colors.background}`);
  }
  if (branding.colors.text) {
    vars.push(`--color-branding-text: ${branding.colors.text}`);
  }
  if (branding.typography.font_family) {
    vars.push(`--font-branding: ${branding.typography.font_family}`);
  }
  if (branding.typography.heading_font_family) {
    vars.push(
      `--font-branding-heading: ${branding.typography.heading_font_family}`
    );
  }
  if (branding.typography.base_font_size) {
    vars.push(
      `--font-branding-size: ${branding.typography.base_font_size}px`
    );
  }

  return vars.join("; ");
}
