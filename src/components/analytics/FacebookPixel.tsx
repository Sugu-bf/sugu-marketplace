/**
 * Facebook / Meta Pixel — client component.
 *
 * Responsibilities:
 * 1. Injects the fbevents.js snippet once (via next/script afterInteractive).
 * 2. Fires a `ViewContent` event after React hydration using the product data
 *    passed as props.
 *
 * Usage (Server Component page):
 * ```tsx
 * {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
 *   <FacebookPixel
 *     pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
 *     contentId={product.sku || String(product.id)}
 *     contentName={product.name}
 *     contentCategory={product.categoryName}
 *     value={product.price}
 *     currency="XOF"
 *   />
 * )}
 * ```
 */

"use client";

import Script from "next/script";
import { useEffect } from "react";

// ─── Types ───────────────────────────────────────────────────

interface FacebookPixelProps {
  pixelId: string;
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
  pixelId,
  contentId,
  contentName,
  contentCategory,
  value,
  currency = "XOF",
}: FacebookPixelProps) {
  // Fire ViewContent after hydration so fbq is guaranteed to exist
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_ids: [contentId],
        content_type: "product",
        content_name: contentName,
        content_category: contentCategory,
        value,
        currency,
      });
    }
  }, [contentId, contentName, contentCategory, value, currency]);

  // The base pixel snippet — only injected once (id deduplication by next/script)
  const pixelSnippet = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `;

  return (
    <>
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: pixelSnippet }}
      />
      {/* noscript fallback for non-JS environments */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
