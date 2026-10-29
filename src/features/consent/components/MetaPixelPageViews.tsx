"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "../consent";
import { isTrackedRoute, trackPixel } from "../meta-pixel";

/**
 * Mounted once in the root layout: one PageView per route the visitor sees,
 * once (and only once) they accepted measurement. Checkout and payment
 * returns are never measured.
 */
export function MetaPixelPageViews() {
  const pathname = usePathname();
  const consent = useConsent();

  useEffect(() => {
    if (consent === "granted" && isTrackedRoute(pathname)) trackPixel("PageView");
  }, [consent, pathname]);

  return null;
}
