/**
 * API Endpoint Builders — centralized URL construction.
 *
 * All API URL construction goes through these helpers.
 * No raw string concatenation for URLs elsewhere in the app.
 */

import { API_BASE_URL } from "./config";

/**
 * Params that can be passed to buildQueryString.
 * Supports strings, numbers, booleans, arrays, null/undefined (skipped).
 */
export type QueryParams = Record<
  string,
  string | number | boolean | string[] | number[] | null | undefined
>;

/**
 * Build a robust query string from a params object.
 *
 * - Skips null/undefined values
 * - Handles arrays (key[]=val1&key[]=val2)
 * - Encodes values properly
 *
 * @example
 * buildQueryString({ page: 1, per_page: 20, categories: ['a', 'b'], q: null })
 * // "page=1&per_page=20&categories%5B%5D=a&categories%5B%5D=b"
 */
export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(`${key}[]`, String(item));
      }
    } else {
      searchParams.set(key, String(value));
    }
  }

  return searchParams.toString();
}

/**
 * Build a full API URL from a path and optional params.
 *
 * @param path — API path, e.g. "/v1/public/categories"
 * @param params — optional query params
 * @returns Full URL string, e.g. "https://api.mysugu.com/v1/public/categories?page=1"
 *
 * @example
 * buildApiUrl("/v1/public/products", { page: 1, per_page: 20 })
 */
export function buildApiUrl(path: string, params?: QueryParams): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = `${API_BASE_URL}${normalizedPath}`;

  if (!params) return base;

  const qs = buildQueryString(params);
  return qs ? `${base}?${qs}` : base;
}

// ─── Common API Path Builders ────────────────────────────────
// These are thin helpers for common prefixes to avoid typos.

/** Build a public API v1 URL */
export function publicUrl(path: string, params?: QueryParams): string {
  return buildApiUrl(`/api/v1/public/${path.replace(/^\//, "")}`, params);
}

/** Build an authenticated "me" API v1 URL */
export function meUrl(path: string, params?: QueryParams): string {
  return buildApiUrl(`/api/v1/me/${path.replace(/^\//, "")}`, params);
}

/** Build a generic v1 API URL */
export function v1Url(path: string, params?: QueryParams): string {
  return buildApiUrl(`/api/v1/${path.replace(/^\//, "")}`, params);
}

// ─── Pagination Helpers ──────────────────────────────────────

export interface PaginationParams {
  page?: number;
  perPage?: number;
}

/** Standard pagination query params */
export function paginationParams(opts: PaginationParams = {}): QueryParams {
  return {
    page: opts.page ?? 1,
    per_page: opts.perPage ?? 20,
  };
}
