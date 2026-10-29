/**
 * Payment redirect guard.
 *
 * The backend hands the browser a provider checkout URL to leave the site for.
 * Before `window.location` is pointed at it, the URL must be an absolute
 * `https:` address on one of the payment providers we trust: anything else
 * (another scheme, a protocol-relative or relative URL, credentials in the
 * authority, a non-default port, a lookalike host such as
 * `app.ligdicash.com.evil.tld`) is refused and treated as a failed payment
 * initiation.
 *
 * The trusted hosts come from `NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS`
 * (comma-separated hostnames, inlined at build time), with the production
 * providers as default.
 */

export const DEFAULT_PAYMENT_REDIRECT_HOSTS = ["app.ligdicash.com", "api.sugupay.net"] as const;

/** Parse a comma-separated host list; an empty or missing list falls back to the defaults. */
export function parsePaymentRedirectHosts(raw: string | undefined): string[] {
  const hosts = (raw ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host.length > 0);

  return hosts.length > 0 ? hosts : [...DEFAULT_PAYMENT_REDIRECT_HOSTS];
}

export const PAYMENT_REDIRECT_HOSTS: readonly string[] = parsePaymentRedirectHosts(
  process.env.NEXT_PUBLIC_PAYMENT_REDIRECT_HOSTS
);

/**
 * The URL to send the buyer to, normalized, or `null` when it is not a
 * trusted payment provider URL.
 */
export function safePaymentRedirectUrl(
  url: unknown,
  allowedHosts: readonly string[] = PAYMENT_REDIRECT_HOSTS
): string | null {
  if (typeof url !== "string" || url.length === 0) return null;
  // The WHATWG parser silently trims whitespace and turns "\" into "/";
  // a provider URL never needs either, so refuse rather than reinterpret.
  if (url !== url.trim() || url.includes("\\")) return null;
  if (!/^https:\/\//i.test(url)) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  if (parsed.username !== "" || parsed.password !== "") return null;
  if (parsed.port !== "") return null;
  if (!allowedHosts.includes(parsed.hostname)) return null;

  return parsed.href;
}

export function isTrustedPaymentUrl(
  url: unknown,
  allowedHosts: readonly string[] = PAYMENT_REDIRECT_HOSTS
): boolean {
  return safePaymentRedirectUrl(url, allowedHosts) !== null;
}
