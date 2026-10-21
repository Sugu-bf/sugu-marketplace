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
 * Where each kind of attachment is read, as the API names it. Ids are ULIDs
 * (26 letters or digits), a media id is a number: nothing else gets through,
 * no other route, no `..`, no query, no other host.
 */
const ULID = "[0-9A-Za-z]{26}";
const ATTACHMENT_PATHS = {
  /** A buyer ↔ seller / courier conversation. */
  conversation: new RegExp(`^me/conversations/${ULID}/messages/(${ULID})/attachments/\\d{1,20}$`),
  /** The buyer's live support chat. */
  supportChat: new RegExp(`^me/support-chat/${ULID}/messages/(${ULID})/attachments/\\d{1,20}$`),
} as const;

export type AttachmentScope = keyof typeof ATTACHMENT_PATHS;

/**
 * The address the browser reads an attachment from: the API path the server
 * gave, through the marketplace relay, which adds the session. Null when the
 * path is not one of `scope`, or belongs to another message than `messageId`:
 * such an attachment is not rendered at all.
 */
export function attachmentUrl(
  path: unknown,
  scope: AttachmentScope,
  messageId?: string,
): string | null {
  if (typeof path !== "string") return null;
  const match = ATTACHMENT_PATHS[scope].exec(path);
  if (!match) return null;
  if (messageId !== undefined && match[1] !== messageId) return null;
  return `/api/backend/api/v1/${path}`;
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
