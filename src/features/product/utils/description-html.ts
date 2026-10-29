/**
 * Product description → HTML for the description tab.
 *
 * The backend sends `description_html` already sanitized (HTMLPurifier,
 * allowlist without `style` nor `on*`). This module adds a second, independent
 * barrier and never builds markup out of untrusted text without escaping it:
 *
 * - markup is rendered only when every tag is an expected formatting tag, with
 *   no handler, style, script URL, and only pictures from the Sugu CDN;
 *   anything else is shown as plain text;
 * - a description without markup (or the short description, which is plain
 *   text) is escaped first; markdown pictures `![alt](url)` and bare picture
 *   URLs are then turned into `<img>` tags whose `src` and `alt` are escaped.
 */

/** Hosts a description picture may come from (exact match, https only). */
export const DESCRIPTION_IMAGE_HOSTS: readonly string[] = ["cdn.sugu.pro"];

const ALLOWED_TAGS = new Set([
  "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "del", "mark", "span",
  "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "code", "ul", "ol", "li",
  "img", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "colgroup", "col",
]);

const TAG_PATTERN = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
const UNSAFE_MARKUP_PATTERN =
  /<!|[\s"'/]on[a-z]+\s*=|[\s"'/](?:style|srcdoc|formaction|xlink:href)\s*=|=\s*["']?\s*(?:javascript|vbscript|data)\s*:/i;
const IMG_SRC_PATTERN = /\ssrc\s*=\s*"([^"]*)"/i;

const IMG_CLASS = "max-w-full h-auto rounded-2xl my-4 border border-border/80 shadow-sm bg-white p-2";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape text for an HTML text node or a quoted attribute value. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Escape text that is already HTML text (entities kept) for an attribute:
 * quotes and angle brackets are escaped, and a `&` that does not start an
 * entity reference.
 */
function escapeHtmlText(text: string): string {
  return text
    .replace(/&(?![a-zA-Z][a-zA-Z0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, "&amp;")
    .replace(/[<>"']/g, (char) => HTML_ESCAPES[char]);
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&");
}

/** The URL, normalized, when it is an https picture of an allowed host. */
export function allowedImageUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(decodeBasicEntities(raw.trim()));
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (!DESCRIPTION_IMAGE_HOSTS.includes(url.hostname.toLowerCase())) return null;
  return url.href;
}

function imgTag(src: string, alt: string): string {
  return `<img src="${escapeHtml(src)}" alt="${alt}" class="${IMG_CLASS}" />`;
}

function isSafeMarkup(html: string): boolean {
  if (UNSAFE_MARKUP_PATTERN.test(html)) return false;
  for (const [markup, name] of html.matchAll(TAG_PATTERN)) {
    const tag = name.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return false;
    if (tag === "img") {
      const src = IMG_SRC_PATTERN.exec(markup)?.[1];
      if (!src || !allowedImageUrl(src)) return false;
    }
  }
  return true;
}

/** Text of a markup that is not rendered as such: tags removed, then escaped. */
function markupAsText(html: string): string {
  const text = decodeBasicEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
  return text ? `<p>${escapeHtml(text)}</p>` : "";
}

const MARKDOWN_IMAGE_OR_IMAGE_URL =
  /!\[([^\]]*)\]\(([^\s)]+)\)|(https:\/\/[^\s<>"']+\.(?:png|jpe?g|webp|gif|avif)(?:\?[^\s<>"']*)?)/gi;

/** HTML text (no tag, entities escaped) → paragraphs with its pictures. */
function formatText(htmlText: string): string {
  const withPictures = htmlText.replace(
    MARKDOWN_IMAGE_OR_IMAGE_URL,
    (_match, alt: string | undefined, markdownUrl: string | undefined, bareUrl: string | undefined) => {
      const src = allowedImageUrl(markdownUrl ?? bareUrl ?? "");
      if (!src) return "";
      return imgTag(src, markdownUrl !== undefined ? escapeHtmlText(alt || "Illustration") : "Illustration produit");
    },
  );

  return withPictures
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

/**
 * HTML of the description tab, from the sanitized `description_html` of the
 * API, or else from a plain-text description.
 */
export function formatDescriptionHtml(descriptionHtml: string | null | undefined, plainText = ""): string {
  if (descriptionHtml) {
    if (!/<[a-zA-Z!/]/.test(descriptionHtml)) return formatText(escapeHtmlText(descriptionHtml));
    return isSafeMarkup(descriptionHtml) ? descriptionHtml : markupAsText(descriptionHtml);
  }
  return plainText ? formatText(escapeHtml(plainText)) : "";
}
