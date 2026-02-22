"use client";

import { useEffect } from "react";
import { useBranding } from "@/components/BrandingProvider";
import { brandingToCssVars } from "@/lib/branding.service";

/**
 * Injects branding CSS custom properties into <html> and updates
 * favicon/apple-touch-icon dynamically.
 *
 * This component should be rendered once in the root layout.
 * It NEVER causes a crash — all operations are guarded.
 */
export default function BrandingHead() {
  const branding = useBranding();

  useEffect(() => {
    if (!branding) return;

    try {
      // Inject CSS variables
      const cssVars = brandingToCssVars(branding);
      if (cssVars) {
        document.documentElement.style.cssText += `; ${cssVars}`;
      }

      // Also override the core --color-primary if the API provides it
      if (branding.colors?.primary) {
        document.documentElement.style.setProperty(
          "--color-primary",
          branding.colors.primary
        );
      }

      // Update favicon
      if (branding.logos?.favicon_url) {
        const existing = document.querySelector<HTMLLinkElement>(
          'link[rel="icon"]'
        );
        if (existing) {
          existing.href = branding.logos.favicon_url;
        } else {
          const link = document.createElement("link");
          link.rel = "icon";
          link.href = branding.logos.favicon_url;
          document.head.appendChild(link);
        }
      }

      // Update apple-touch-icon
      if (branding.logos?.apple_touch_icon_url) {
        const existing = document.querySelector<HTMLLinkElement>(
          'link[rel="apple-touch-icon"]'
        );
        if (existing) {
          existing.href = branding.logos.apple_touch_icon_url;
        } else {
          const link = document.createElement("link");
          link.rel = "apple-touch-icon";
          link.href = branding.logos.apple_touch_icon_url;
          document.head.appendChild(link);
        }
      }

      // Update theme-color meta
      if (branding.colors?.primary) {
        const meta = document.querySelector<HTMLMetaElement>(
          'meta[name="theme-color"]'
        );
        if (meta) {
          meta.content = branding.colors.primary;
        }
      }
    } catch {
      // Never crash the app because of branding
      console.warn("[BrandingHead] Error applying branding, ignoring");
    }
  }, [branding]);

  return null; // This component only has side effects
}
