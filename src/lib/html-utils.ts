/**
 * HTML sanitization utilities — safe for Server Components (no DOM dependency).
 *
 * These functions are pure regex-based transforms that work in any JS environment
 * (Node, Edge, browser) without requiring DOMParser or document.
 */

/**
 * Strip all HTML tags from a string and decode common HTML entities.
 * Truncates the result at `maxLength` characters on a word boundary.
 *
 * @example
 * stripHtml("<p><strong>Hello</strong> World &amp; more</p>", 20)
 * // → "Hello World & more"
 */
export function stripHtml(html: string, maxLength = 155): string {
  if (!html) return "";

  const text = html
    .replace(/<[^>]+>/g, " ") // replace tags with a space (avoids word merging)
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/\s{2,}/g, " ") // collapse consecutive whitespace
    .trim();

  if (text.length <= maxLength) return text;

  // Truncate at word boundary to avoid cutting a word in half
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
