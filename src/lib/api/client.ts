/**
 * Central API Client — the single fetch wrapper for the entire app.
 *
 * Features:
 * - Works in Server Components (SSR/RSC) and Client Components
 * - Automatic timeout via AbortController
 * - Exponential retry for idempotent requests (GET/HEAD only)
 * - Normalized error handling (always throws ApiError)
 * - Optional Zod runtime validation
 * - CSRF token management for Sanctum
 * - X-Request-Id tracking
 * - Credentials included for cookie-based auth
 * - Next.js fetch caching integration (revalidate, tags)
 *
 * RULES:
 * - Never log auth headers, cookies, or tokens
 * - Never store tokens in localStorage
 * - All requests go through this module
 */

import type { z } from "zod";
import { API_TIMEOUT_MS, API_MAX_RETRIES, API_RETRY_BASE_DELAY_MS } from "./config";
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

  /** Request timeout in ms (default: API_TIMEOUT_MS) */
  timeout?: number;

  /** Number of retries for idempotent requests (default: API_MAX_RETRIES for GET/HEAD, 0 for others) */
  retries?: number;

  /** Custom X-Request-Id (auto-generated if not provided) */
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * CSRF note: Sanctum's XSRF-TOKEN approach does NOT work in this
 * cross-domain setup (sugu.pro → api.mysugu.com). Protection against
 * CSRF is provided by Bearer token auth + Content-Type: application/json
 * (which triggers CORS preflight) + strict CORS allowed_origins.
 */

/**
 * Read the auth_token for Bearer token auth.
 *
 * CLIENT-SIDE : lit document.cookie directement.
 * Le cookie auth_token est intentionnellement lisible par JS (non HttpOnly)
 * car l'API Laravel utilise UNIQUEMENT Authorization: Bearer — pas le mode
 * cookie stateful de Sanctum (incompatible cross-domain sugu.pro → api.mysugu.com).
 *
 * Sécurité CSRF : garantie par Bearer token + CORS strict (pas par HttpOnly).
 * Un attaquant cross-origin ne peut pas forger le header Authorization.
 *
 * SERVER-SIDE : délègue à server-auth.ts via dynamic import pour éviter que
 * next/headers soit détecté statiquement et casse l'ISR sur les pages publiques.
 */
async function getAuthToken(): Promise<string | null> {
  // Client-side : lire auth_token depuis document.cookie (non HttpOnly, volontaire)
  if (typeof document !== "undefined") {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="));
    if (match) {
      return decodeURIComponent(match.split("=")[1]);
    }
    return null;
  }

  // Server-side : lire depuis next/headers (requête entrante SSR)
  // Dynamic import évite la détection statique de next/headers qui casserait l'ISR
  try {
    const { getServerAuthToken } = await import("./server-auth");
    return await getServerAuthToken();
  } catch {
    return null;
  }
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
    timeout = API_TIMEOUT_MS,
    requestId = generateRequestId(),
    skipCredentials = false,
    body,
    headers: customHeaders,
    ...restInit
  } = options;

  const method = (restInit.method ?? "GET").toUpperCase();

  // ─ Build headers (NEVER log these) ────────────────────────
  const headers = new Headers(customHeaders as HeadersInit);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  headers.set("X-Request-Id", requestId);

  // Bearer token from auth_token cookie
  // Skip for public requests (skipCredentials) — calling cookies() opts
  // the route into dynamic rendering and breaks ISR.
  if (!headers.has("Authorization") && !skipCredentials) {
    const token = await getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Content-Type for JSON body (skip for FormData — browser sets boundary)
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (body && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // ─ AbortController for timeout ────────────────────────────
  const controller = new AbortController();
  const externalSignal = restInit.signal;

  // Merge external signal with timeout
  if (externalSignal) {
    externalSignal.addEventListener("abort", () => controller.abort(externalSignal.reason));
  }

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
    const response = await fetch(url, fetchOptions);

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);

    // Already an ApiError — rethrow
    if (error instanceof ApiError) throw error;

    // AbortError — timeout or user abort
    if (error instanceof DOMException || (error instanceof Error && error.name === "AbortError")) {
      const isTimeout =
        (error as DOMException).message === "TIMEOUT" ||
        controller.signal.reason === "TIMEOUT";

      throw new ApiError({
        status: 0,
        code: isTimeout ? "TIMEOUT" : "ABORTED",
        message: isTimeout
          ? "La requête a expiré. Vérifiez votre connexion."
          : "La requête a été annulée.",
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
  }
}

// ─── Retry Logic ─────────────────────────────────────────────

async function requestWithRetry<T>(
  url: string,
  options: ApiRequestOptions<T>
): Promise<ApiResponse<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  const maxRetries = options.retries ?? (isIdempotent(method) ? API_MAX_RETRIES : 0);

  let lastError: ApiError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeRequest<T>(url, options);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;

      lastError = error;

      // Only retry if the error is retryable and we have attempts left
      if (!error.isRetryable || attempt >= maxRetries) {
        throw error;
      }

      // Exponential backoff: 500ms, 1000ms, 2000ms, ...
      const delay = API_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError!;
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
