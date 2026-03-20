/**
 * OG image URL builder — generates a 1200×630 image URL for Facebook/OpenGraph.
 *
 * Strategy:
 * 1. If the image is served from cdn.sugu.pro or api.mysugu.com,
 *    use Cloudflare Image Resizing (via /cdn-cgi/image/) for free.
 * 2. Otherwise return the raw URL unchanged (external sources).
 * 3. A site-default PNG is used when no URL is provided.
 *
 * Cloudflare Image Resizing must be enabled on the sugu.pro zone.
 * See: https://developers.cloudflare.com/images/image-resizing/
 */

import { SITE_URL } from "./constants";

const OG_DEFAULT = `${SITE_URL}/og-default.png`;
const CDN_HOSTS = ["cdn.sugu.pro", "api.mysugu.com"];

/**
 * Build an OG-optimised image URL (1200×630, fit=cover) for Facebook Ads.
 *
 * @param rawUrl - The source image URL (from the product API)
 * @returns A Cloudflare-resized URL or the original URL if not on our CDN.
 */
export function buildOgImageUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl) return OG_DEFAULT;

  const isCdnImage = CDN_HOSTS.some((host) => rawUrl.includes(host));
  if (!isCdnImage) return rawUrl;

  // Cloudflare Image Resizing — proxied through our own domain
  const encoded = encodeURIComponent(rawUrl);
  return `${SITE_URL}/cdn-cgi/image/width=1200,height=630,fit=cover,format=auto/${encoded}`;
}
