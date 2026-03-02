/**
 * API Configuration — Single source of truth.
 *
 * RULE: The base URL MUST point to https://api.mysugu.com.
 * Any attempt to use localhost / 127.0.0.1 will throw at startup.
 */

const FORBIDDEN_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "::1"] as const;

function resolveApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const fallback = "https://api.mysugu.com";

  const baseUrl = envUrl?.trim() || fallback;

  // Guard: reject any local URL
  try {
    const parsed = new URL(baseUrl);
    if (
      FORBIDDEN_HOSTS.some(
        (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      )
    ) {
      throw new Error(
        `[API Config] FATAL: API base URL "${baseUrl}" points to a local address. ` +
          `Only https://api.mysugu.com (or its subdomains) is allowed.`
      );
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        `[API Config] FATAL: Invalid API base URL "${baseUrl}". Must be a valid URL.`
      );
    }
    throw e;
  }

  // Strip trailing slash for consistent URL building
  return baseUrl.replace(/\/+$/, "");
}

/** The resolved, validated API base URL. Always https://api.mysugu.com in production. */
export const API_BASE_URL = resolveApiBaseUrl();

/** Default request timeout in milliseconds */
export const API_TIMEOUT_MS = 10_000;

/** Max retries for idempotent requests (GET/HEAD) */
export const API_MAX_RETRIES = 2;

/** Base delay for exponential backoff in ms */
export const API_RETRY_BASE_DELAY_MS = 500;

/** Default ISR revalidation in seconds for public data */
export const API_DEFAULT_REVALIDATE_S = 300;
