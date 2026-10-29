/**
 * SEO redirect resolution for paths the App Router does not serve (legacy
 * URLs, renamed slugs). The backend owns the rules; the proxy asks it once per
 * path and keeps the answer for CACHE_TTL_MS in a bounded LRU cache.
 *
 * The cache key is the pathname alone: a query string never selects a rule, so
 * random query strings cannot flood the cache or the backend. The visitor's
 * query string is carried over to a destination that has none of its own.
 */

export const CACHE_TTL_MS = 10 * 60 * 1000;
export const CACHE_MAX_ENTRIES = 5_000;
const RESOLVE_TIMEOUT_MS = 2_000;

export interface SeoRedirect {
  destination: string;
  statusCode: 301 | 302;
}

interface CacheEntry {
  redirect: SeoRedirect | null;
  expiresAt: number;
}

/** Least-recently-used cache: a Map keeps insertion order, a hit re-inserts. */
export class LruCache<V> {
  private readonly entries = new Map<string, V>();

  constructor(private readonly maxEntries: number) {}

  get(key: string): V | undefined {
    const value = this.entries.get(key);
    if (value === undefined) return undefined;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  set(key: string, value: V): void {
    this.entries.delete(key);
    this.entries.set(key, value);
    if (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
  }

  get size(): number {
    return this.entries.size;
  }

  clear(): void {
    this.entries.clear();
  }
}

const cache = new LruCache<CacheEntry>(CACHE_MAX_ENTRIES);

/** Test-only: forget every cached answer. */
export function __clearSeoRedirectCache(): void {
  cache.clear();
}

export function isSafeRelativeRedirect(destination: unknown): destination is string {
  if (typeof destination !== "string") return false;
  if (destination === "/") return true;
  if (/[\x00-\x1F\x7F]/.test(destination)) return false;
  return /^\/[^/\\]/.test(destination);
}

interface ResolveOptions {
  apiBaseUrl: string;
  /** Extra headers for the backend call (the signed visitor address). */
  headers?: HeadersInit;
  now?: () => number;
}

async function lookup(pathname: string, options: ResolveOptions): Promise<SeoRedirect | null> {
  const url = new URL(`${options.apiBaseUrl}/api/v1/public/redirects/resolve`);
  url.searchParams.set("path", pathname);

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { match?: unknown; to?: unknown; status_code?: unknown };
  if (!data.match || !data.to) return null;

  if (!isSafeRelativeRedirect(data.to)) {
    console.warn(`[seo-redirect] Blocked external redirect: ${String(data.to).slice(0, 200)}`);
    return null;
  }

  return { destination: data.to, statusCode: data.status_code === 302 ? 302 : 301 };
}

/**
 * The redirect for `pathname`, or null. Never throws: a backend failure means
 * "no redirect" (cached too, so a failing backend is not hammered).
 */
export async function resolveSeoRedirect(
  pathname: string,
  options: ResolveOptions,
): Promise<SeoRedirect | null> {
  const now = options.now ?? Date.now;
  const cached = cache.get(pathname);
  if (cached && cached.expiresAt > now()) return cached.redirect;

  let redirect: SeoRedirect | null = null;
  try {
    redirect = await lookup(pathname, options);
  } catch (error) {
    if (!(error instanceof Error) || (error.name !== "AbortError" && error.name !== "TimeoutError")) {
      console.error("[seo-redirect] Resolve error:", error instanceof Error ? error.message : error);
    }
  }

  cache.set(pathname, { redirect, expiresAt: now() + CACHE_TTL_MS });
  return redirect;
}

/** The absolute redirect target, keeping the visitor's query when the rule has none. */
export function redirectTarget(redirect: SeoRedirect, requestUrl: string): URL {
  const target = new URL(redirect.destination, requestUrl);
  if (!target.search) target.search = new URL(requestUrl).search;
  return target;
}
