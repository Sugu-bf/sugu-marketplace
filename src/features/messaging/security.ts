/**
 * Security helpers for sanitizing user-provided URLs and filenames.
 *
 * Used by messaging components to prevent XSS via href/src attributes
 * and social engineering via crafted filenames.
 */

/**
 * Check if a URL is safe to use in <a href> or <img src>.
 * Only allows http: and https: protocols.
 * Blocks: javascript:, data:, vbscript:, blob:, etc.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, "https://placeholder.invalid");
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Return the URL if safe, or empty string otherwise.
 * Use for <img src={safeSrc(url)} /> to prevent unsafe protocol injection.
 */
export function safeSrc(url: string | null | undefined): string {
  return isSafeUrl(url) ? url! : "";
}

/**
 * Return the URL if safe, or "#" otherwise.
 * Use for <a href={safeHref(url)} /> to prevent javascript: injection.
 */
export function safeHref(url: string | null | undefined): string {
  return isSafeUrl(url) ? url! : "#";
}

/**
 * Validate that a slug only contains safe characters for URL path segments.
 * Prevents path traversal (e.g. "../admin") via slugs.
 */
export function isSafeSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return /^[a-zA-Z0-9_-]+$/.test(slug);
}

/**
 * Validate MIME type against an allowlist.
 */
const ALLOWED_UPLOAD_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function isAllowedMime(file: File): boolean {
  return ALLOWED_UPLOAD_MIMES.has(file.type);
}

/**
 * Truncate a filename for safe display, preserving the extension.
 * Prevents social engineering with long filenames like "invoice_sugu_official.exe.pdf"
 */
export function safeFilename(name: string, maxLen = 40): string {
  if (name.length <= maxLen) return name;
  const ext = name.includes(".") ? "." + name.split(".").pop() : "";
  const base = name.slice(0, maxLen - ext.length - 3);
  return `${base}...${ext}`;
}
