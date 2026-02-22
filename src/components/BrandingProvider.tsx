"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { BrandingData } from "@/lib/branding.types";
import { BRANDING_FALLBACK } from "@/lib/branding.service";

const BrandingContext = createContext<BrandingData>(BRANDING_FALLBACK);

/**
 * Client-side branding provider.
 * Receives pre-fetched branding data from the Server Component (layout).
 */
export function BrandingProvider({
  branding,
  children,
}: {
  branding: BrandingData;
  children: ReactNode;
}) {
  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

/**
 * Hook to access branding data from any client component.
 * Always returns valid data (fallback if context is missing).
 *
 * @example
 * const { colors, logos, site } = useBranding();
 */
export function useBranding(): BrandingData {
  return useContext(BrandingContext);
}
