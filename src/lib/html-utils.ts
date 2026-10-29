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
 * The result never contains `<` or `>`: an encoded `&lt;/script&gt;` of a
 * seller text must not come back as markup in a meta tag or a JSON-LD block.
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
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&") // last, so "&amp;lt;" stays the text "&lt;"
    .replace(/[<>]/g, " ") // decoded brackets never reach the output
    .replace(/\s{2,}/g, " ") // collapse consecutive whitespace
    .trim();

  if (text.length <= maxLength) return text;

  // Truncate at word boundary to avoid cutting a word in half
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
