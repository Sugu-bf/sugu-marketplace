/**
 * Meta Pixel `ViewContent` for a product page — client component.
 *
 * The pixel itself is loaded once for the whole site, and only after the
 * visitor accepted measurement (see @/features/consent): this component only
 * reports the product seen, and does nothing without consent.
 *
 * Usage (Server Component page):
 * ```tsx
 * <FacebookPixel
 *   contentId={product.sku || String(product.id)}
 *   contentName={product.name}
 *   contentCategory={product.categoryName}
 *   value={product.price}
 *   currency="XOF"
 * />
 * ```
 */

"use client";

import { useEffect } from "react";
import { useConsent } from "@/features/consent/consent";
import { trackPixel } from "@/features/consent/meta-pixel";

// ─── Types ───────────────────────────────────────────────────

interface FacebookPixelProps {
  /** The product ID that matches your Facebook Catalogue (retailer_item_id) */
  contentId: string;
  contentName: string;
  contentCategory: string;
  /** Price in XOF (integer, no decimals) */
  value: number;
  currency?: string;
}

// ─── Component ───────────────────────────────────────────────

export function FacebookPixel({
  contentId,
  contentName,
  contentCategory,
  value,
  currency = "XOF",
}: FacebookPixelProps) {
  const consent = useConsent();

  useEffect(() => {
    if (consent !== "granted") return;
    trackPixel("ViewContent", {
      content_ids: [contentId],
      content_type: "product",
      content_name: contentName,
      content_category: contentCategory,
      value,
      currency,
    });
  }, [consent, contentId, contentName, contentCategory, value, currency]);

  return null;
}
