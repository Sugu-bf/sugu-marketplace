/**
 * Recent Searches — cookie-based persistence (non-sensitive).
 *
 * Stores up to MAX_RECENT recent search terms in a cookie.
 * Cookie is read/write on the client, readable on SSR via next/headers.
 *
 * Cookie name: "sugu_recent_searches"
 * Format: JSON array of strings
 * Max items: 8
 * Expiry: 30 days
 *
 * NOT localStorage (cookie preferred for SSR consistency).
 */

const COOKIE_NAME = "sugu_recent_searches";
const MAX_RECENT = 8;
const COOKIE_MAX_AGE_S = 30 * 24 * 60 * 60; // 30 days

// ─── Client-side helpers ─────────────────────────────────────

function normalize(term: string): string {
  return term.trim().toLowerCase();
}

/**
 * Read recent searches from cookie (client-side).
 */
export function getRecentSearches(): string[] {
  if (typeof document === "undefined") return [];

  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${COOKIE_NAME}=`));

    if (!match) return [];

    const value = decodeURIComponent(match.split("=").slice(1).join("="));
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Write recent searches to cookie (client-side).
 */
function setRecentSearches(searches: string[]): void {
  if (typeof document === "undefined") return;

  const value = JSON.stringify(searches.slice(0, MAX_RECENT));
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE_S};SameSite=Lax`;
}

/**
 * Add a search term to recent searches.
 * Deduplicates (case-insensitive) and keeps max 8.
 */
export function addRecentSearch(term: string): string[] {
  const normalized = normalize(term);
  if (!normalized) return getRecentSearches();

  const current = getRecentSearches();
  // Remove existing (dedup) then prepend
  const filtered = current.filter((s) => normalize(s) !== normalized);
  const updated = [term.trim(), ...filtered].slice(0, MAX_RECENT);
  setRecentSearches(updated);
  return updated;
}

/**
 * Remove a single search term from recent searches.
 */
export function removeRecentSearch(term: string): string[] {
  const normalized = normalize(term);
  const current = getRecentSearches();
  const updated = current.filter((s) => normalize(s) !== normalized);
  setRecentSearches(updated);
  return updated;
}

/**
 * Clear all recent searches.
 */
export function clearRecentSearches(): string[] {
  setRecentSearches([]);
  return [];
}
