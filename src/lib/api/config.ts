/**
 * API Configuration — Single source of truth.
 *
 * A production build (`next build`, `next start`: NODE_ENV=production) only
 * talks to a remote https API: a local address throws at startup. Development
 * and tests may point NEXT_PUBLIC_API_BASE_URL at a local or staging API, so
 * that nobody develops or tests against production data (audit M7).
 */

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"] as const;

function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function resolveApiBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "https://api.mysugu.com";

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(`[API Config] FATAL: Invalid API base URL "${baseUrl}". Must be a valid URL.`);
  }

  if (process.env.NODE_ENV === "production") {
    if (isLocalHost(parsed.hostname)) {
      throw new Error(
        `[API Config] FATAL: API base URL "${baseUrl}" points to a local address. ` +
          `A production build only talks to a remote https API.`
      );
    }
    if (parsed.protocol !== "https:") {
      throw new Error(`[API Config] FATAL: API base URL "${baseUrl}" must use https in production.`);
    }
  } else if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`[API Config] FATAL: Invalid API base URL "${baseUrl}". Must be http(s).`);
  }

  // Strip trailing slash for consistent URL building
  return baseUrl.replace(/\/+$/, "");
}

/** The resolved, validated API base URL (a remote https API in production). */
export const API_BASE_URL = resolveApiBaseUrl();

/** Request timeout in the browser, in milliseconds */
export const API_TIMEOUT_MS = 10_000;

/**
 * Request timeout while rendering on the server: a slow backend must not hold
 * a page (and a timed out request is not retried there).
 */
export const API_SERVER_TIMEOUT_MS = 5_000;

/** Max retries for idempotent requests (GET/HEAD) in the browser */
export const API_MAX_RETRIES = 2;

/** Max retries for idempotent requests (GET/HEAD) while rendering on the server */
export const API_SERVER_MAX_RETRIES = 1;

/** Base delay for exponential backoff in ms */
export const API_RETRY_BASE_DELAY_MS = 500;

/** The longest Retry-After the client waits out before retrying, in ms */
export const API_MAX_RETRY_AFTER_MS = 3_000;

/** Default ISR revalidation in seconds for public data */
export const API_DEFAULT_REVALIDATE_S = 300;
