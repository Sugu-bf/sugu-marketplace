/**
 * Central API Client — the single fetch wrapper for the entire app.
 *
 * Features:
 * - Works in Server Components (SSR/RSC) and Client Components
 * - Automatic timeout via AbortController (shorter while rendering on the server)
 * - Bounded retry for idempotent requests (GET/HEAD only), honouring Retry-After
 * - Normalized error handling (always throws ApiError)
 * - Optional Zod runtime validation
 * - CSRF token management for Sanctum
 * - X-Request-Id tracking (never on server reads served from the Next data cache)
 * - Credentials included for cookie-based auth
 * - Next.js fetch caching integration (revalidate, tags)
 *
 * RULES:
 * - Never log auth headers, cookies, or tokens
 * - Never store tokens in localStorage
 * - All requests go through this module
 */

import type { z } from "zod";
import {
  API_BASE_URL,
  API_MAX_RETRIES,
  API_MAX_RETRY_AFTER_MS,
  API_RETRY_BASE_DELAY_MS,
  API_SERVER_MAX_RETRIES,
  API_SERVER_TIMEOUT_MS,
  API_TIMEOUT_MS,
} from "./config";
import { ApiError, httpStatusToErrorCode } from "./errors";

// ─── Types ───────────────────────────────────────────────────

export interface ApiRequestOptions<T = unknown> extends Omit<RequestInit, "body"> {
  /** Request body — will be JSON.stringified unless it's FormData */
  body?: unknown;

  /** Zod schema for runtime response validation */
  schema?: z.ZodType<T>;

  /** Next.js ISR revalidation in seconds (server only) */
  revalidate?: number | false;

  /** Next.js cache tags for targeted invalidation (server only) */
  tags?: string[];

  /** Request timeout in ms (default: API_SERVER_TIMEOUT_MS on the server, API_TIMEOUT_MS in the browser) */
  timeout?: number;

  /** Number of retries for idempotent requests (default: API_SERVER_MAX_RETRIES / API_MAX_RETRIES for GET/HEAD, 0 for others) */
  retries?: number;

  /** Custom X-Request-Id (auto-generated if not provided; not sent on cached server reads) */
  requestId?: string;

  /** Skip credentials (useful for fully public SSR requests) */
  skipCredentials?: boolean;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
  requestId: string;
}

/** Standard paginated response from Laravel */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function generateRequestId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isIdempotent(method: string): boolean {
  return method === "GET" || method === "HEAD";
}

function isServer(): boolean {
  return typeof window === "undefined";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * A server read the Next data cache serves. Next keys that cache on the
 * request headers: a random X-Request-Id on it would make every lookup a miss
 * (revalidate and tags inert, the disk cache growing without bound).
 */
function isCachedServerRead(
  method: string,
  revalidate: number | false | undefined,
  tags: string[] | undefined,
  cache: RequestCache | undefined,
): boolean {
  if (!isServer() || method !== "GET") return false;
  return (
    revalidate === false ||
    (typeof revalidate === "number" && revalidate > 0) ||
    (tags?.length ?? 0) > 0 ||
    cache === "force-cache"
  );
}

/** Retry-After as a delay in ms: delta-seconds or an HTTP date. */
export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  // An HTTP date opens with its day name: anything else is not one.
  if (!/^[A-Za-z]{3}, /.test(trimmed)) return undefined;
  const date = Date.parse(trimmed);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

function abortedError(requestId: string, cause: unknown): ApiError {
  return new ApiError({
    status: 0,
    code: "ABORTED",
    message: "La requête a été annulée.",
    requestId,
    cause,
  });
}

/**
 * CSRF note: Sanctum's XSRF-TOKEN approach does NOT work in this
 * cross-domain setup. Browser auth calls go through same-origin BFF routes
 * guarded by Origin/Fetch Metadata; the BFF injects Bearer server-side.
 */

/**
 * Read the server-side auth_token for Bearer token auth.
 *
 * Browser requests never read auth_token. Credentialed browser calls are routed
 * through the same-origin BFF, which reads the HttpOnly cookie server-side and
 * injects Authorization when forwarding to Laravel.
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window !== "undefined") return null;

  try {
    const { getServerAuthToken } = await import("./server-auth");
    return await getServerAuthToken();
  } catch {
    return null;
  }
}

/** The signed visitor address for a server call (see ./server-client-ip). */
async function getVisitorAddressHeaders(): Promise<Record<string, string>> {
  const { getServerClientIpHeaders } = await import("./server-client-ip");
  return getServerClientIpHeaders();
}

function shouldProxyThroughBff(url: string, skipCredentials: boolean): boolean {
  if (skipCredentials) return false;
  if (typeof window === "undefined") return false;
  if (process.env.NODE_ENV === "test") return false;

  try {
    const target = new URL(url);
    const apiBase = new URL(API_BASE_URL);
    return target.origin === apiBase.origin && target.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

function toBffUrl(url: string): string {
  const target = new URL(url);
  return `/api/backend${target.pathname}${target.search}`;
}

async function safeParseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError({
      status: response.status,
      code: "PARSE_ERROR",
      message: "La réponse du serveur n'est pas un JSON valide.",
    });
  }
}

// ─── Core Fetch ──────────────────────────────────────────────

async function executeRequest<T>(
  url: string,
  options: ApiRequestOptions<T>
): Promise<ApiResponse<T>> {
  const {
    schema,
    revalidate,
    tags,
    timeout = isServer() ? API_SERVER_TIMEOUT_MS : API_TIMEOUT_MS,
    requestId = generateRequestId(),
    skipCredentials = false,
    body,
    headers: customHeaders,
    ...restInit
  } = options;

  const method = (restInit.method ?? "GET").toUpperCase();
  const proxiedThroughBff = shouldProxyThroughBff(url, skipCredentials);
  const requestUrl = proxiedThroughBff ? toBffUrl(url) : url;

  // ─ Build headers (NEVER log these) ────────────────────────
  const headers = new Headers(customHeaders as HeadersInit);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const cachedServerRead = isCachedServerRead(method, revalidate, tags, restInit.cache);
  if (!cachedServerRead) {
    headers.set("X-Request-Id", requestId);
  }

  // Server direct calls can read the HttpOnly cookie. Browser calls go through
  // the same-origin BFF, so the token never enters JavaScript.
  if (!headers.has("Authorization") && !skipCredentials && !proxiedThroughBff) {
    const token = await getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // A credentialed server call made for one visitor carries that visitor's
  // signed address. A cached read is shared by every visitor: it carries none.
  if (isServer() && !skipCredentials && !cachedServerRead) {
    for (const [name, value] of Object.entries(await getVisitorAddressHeaders())) {
      headers.set(name, value);
    }
  }

  // Content-Type for JSON body (skip for FormData — browser sets boundary)
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // ─ AbortController for timeout ────────────────────────────
  const externalSignal = restInit.signal ?? undefined;
  if (externalSignal?.aborted) throw abortedError(requestId, externalSignal.reason);

  // Merge the caller's signal with the timeout; the listener is removed once
  // the request settles, so a long-lived signal does not collect them.
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener("abort", onExternalAbort, { once: true });

  const timeoutId = setTimeout(() => controller.abort("TIMEOUT"), timeout);

  // ─ Build fetch options ────────────────────────────────────
  const fetchOptions: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    ...restInit,
    method,
    headers,
    signal: controller.signal,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  };

  // Credentials for cookie-based auth
  if (!skipCredentials) {
    fetchOptions.credentials = "include";
  }

  // Next.js caching options (only meaningful in server context)
  if (revalidate !== undefined || tags) {
    fetchOptions.next = {};
    if (revalidate !== undefined) fetchOptions.next.revalidate = revalidate;
    if (tags) fetchOptions.next.tags = tags;
  }

  try {
    const response = await fetch(requestUrl, fetchOptions);

    // ─ Handle error responses ─────────────────────────────
    if (!response.ok) {
      const errorBody = await safeParseJson(response).catch(() => null);
      const errorData = errorBody as Record<string, unknown> | null;

      throw new ApiError({
        status: response.status,
        code: httpStatusToErrorCode(response.status),
        message:
          (errorData?.message as string) ??
          `Erreur API ${response.status}: ${response.statusText}`,
        details: errorData?.errors
          ? { errors: errorData.errors as Record<string, string[]> }
          : undefined,
        requestId,
        retryAfterMs: parseRetryAfter(response.headers.get("retry-after")),
      });
    }

    // ─ Parse response ─────────────────────────────────────
    const data = await safeParseJson(response);

    // ─ Zod validation (optional) ──────────────────────────
    if (schema) {
      const result = schema.safeParse(data);
      if (!result.success) {
        console.error(
          `[API] Schema validation failed for ${method} ${url}`,
          result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
        );
        throw new ApiError({
          status: response.status,
          code: "INVALID_SCHEMA",
          message: "Les données reçues du serveur ne correspondent pas au schéma attendu.",
          details: {
            issues: result.error.issues.map((i) => ({
              path: i.path.join("."),
              message: i.message,
            })),
          },
          requestId,
        });
      }
      return { data: result.data, status: response.status, headers: response.headers, requestId };
    }

    return { data: data as T, status: response.status, headers: response.headers, requestId };
  } catch (error) {
    // Already an ApiError — rethrow
    if (error instanceof ApiError) throw error;

    // AbortError — timeout or user abort
    if (error instanceof DOMException || (error instanceof Error && error.name === "AbortError")) {
      const isTimeout =
        (error as DOMException).message === "TIMEOUT" ||
        controller.signal.reason === "TIMEOUT";

      if (!isTimeout) throw abortedError(requestId, error);

      throw new ApiError({
        status: 0,
        code: "TIMEOUT",
        message: "La requête a expiré. Vérifiez votre connexion.",
        requestId,
        cause: error,
      });
    }

    // Network error
    throw new ApiError({
      status: 0,
      code: "NETWORK_ERROR",
      message: "Impossible de contacter le serveur. Vérifiez votre connexion internet.",
      requestId,
      cause: error,
    });
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

// ─── Retry Logic ─────────────────────────────────────────────

/**
 * Whether a failed attempt is worth another one. Never a 4xx (a 429 only with
 * a short enough Retry-After), never after the caller aborted, and never a
 * server-side timeout: the render already waited a full timeout once.
 */
function shouldRetry(error: ApiError, signal: AbortSignal | null | undefined): boolean {
  if (!error.isRetryable || signal?.aborted) return false;
  if (isServer() && error.code === "TIMEOUT") return false;
  return error.retryAfterMs === undefined || error.retryAfterMs <= API_MAX_RETRY_AFTER_MS;
}

async function requestWithRetry<T>(
  url: string,
  options: ApiRequestOptions<T>
): Promise<ApiResponse<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  const defaultRetries = isServer() ? API_SERVER_MAX_RETRIES : API_MAX_RETRIES;
  const maxRetries = options.retries ?? (isIdempotent(method) ? defaultRetries : 0);

  for (let attempt = 0; ; attempt++) {
    try {
      return await executeRequest<T>(url, options);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      if (attempt >= maxRetries || !shouldRetry(error, options.signal)) throw error;

      // The server's Retry-After, else exponential backoff: 500ms, 1000ms, …
      await sleep(error.retryAfterMs ?? API_RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
    }
  }
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Make a GET request.
 *
 * @example
 * // Simple
 * const res = await api.get<Category[]>("/v1/public/categories");
 *
 * // With Zod validation
 * const res = await api.get("/v1/public/categories", {
 *   schema: CategoriesResponseSchema,
 *   revalidate: 600,
 *   tags: ["categories"],
 * });
 */
async function get<T>(url: string, options?: ApiRequestOptions<T>): Promise<ApiResponse<T>> {
  return requestWithRetry<T>(url, { ...options, method: "GET" });
}

/** Make a POST request. Never retried by default. */
async function post<T>(url: string, options?: ApiRequestOptions<T>): Promise<ApiResponse<T>> {
  return requestWithRetry<T>(url, { ...options, method: "POST" });
}

/** Make a PUT request. Never retried by default. */
async function put<T>(url: string, options?: ApiRequestOptions<T>): Promise<ApiResponse<T>> {
  return requestWithRetry<T>(url, { ...options, method: "PUT" });
}

/** Make a PATCH request. Never retried by default. */
async function patch<T>(url: string, options?: ApiRequestOptions<T>): Promise<ApiResponse<T>> {
  return requestWithRetry<T>(url, { ...options, method: "PATCH" });
}

/** Make a DELETE request. Never retried by default. */
async function del<T = void>(url: string, options?: ApiRequestOptions<T>): Promise<ApiResponse<T>> {
  return requestWithRetry<T>(url, { ...options, method: "DELETE" });
}

/**
 * The API client singleton.
 *
 * @example
 * import { api } from "@/lib/api";
 *
 * // GET with caching
 * const { data } = await api.get<Product[]>(buildApiUrl("/v1/public/products"));
 *
 * // POST with body
 * const { data } = await api.post<CartResponse>(buildApiUrl("/v1/cart/add"), {
 *   body: { product_id: "123", quantity: 1 },
 * });
 */
export const api = { get, post, put, patch, delete: del } as const;
