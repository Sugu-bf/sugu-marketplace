/**
 * Security headers sent with every response of the site (audit P1-12).
 *
 * The Content-Security-Policy ships in Report-Only mode: browsers report what
 * it would block to /api/csp-report without blocking anything. Once the
 * reports show no legitimate source left out, switch to enforcement by setting
 * CSP_ENFORCE=true at build time (the header becomes Content-Security-Policy).
 *
 * The policy keeps 'unsafe-inline' for scripts: the catalogue pages are
 * statically rendered and cached (ISR + CDN), and Next writes inline bootstrap
 * scripts into that cached HTML. A per-request nonce would force every page to
 * be rendered per request, which the catalogue cannot afford. What the policy
 * still enforces: scripts only from this origin and the two third parties the
 * site uses, no plugins, no foreign <base>, no framing, forms posted here only.
 *
 * Pure functions of their input so next.config and the tests share them.
 */

export interface SecurityHeadersEnv {
  production: boolean;
  enforceCsp: boolean;
  apiBaseUrl: string;
  reverbHost?: string;
  reverbPort?: string;
  reverbScheme?: string;
}

export interface HeaderEntry {
  key: string;
  value: string;
}

export const CSP_REPORT_PATH = "/api/csp-report";

/** Meta Pixel: the loader script and the endpoint it reports events to. */
const META_PIXEL_SCRIPT = "https://connect.facebook.net";
const META_PIXEL_ENDPOINT = "https://www.facebook.com";

/** Google Identity Services: script, stylesheet, iframe and token endpoint. */
const GOOGLE_IDENTITY = "https://accounts.google.com";

const CDN = "https://cdn.sugu.pro";

/** Reverse geocoding used by the pre-launch seller form. */
const GEOCODER = "https://nominatim.openstreetmap.org";

function origin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function reverbSource(env: SecurityHeadersEnv): string | null {
  const host = env.reverbHost?.trim();
  if (!host || /[\s;,]/.test(host)) return null;

  const secure = env.reverbScheme === "https";
  const port = env.reverbPort?.trim();
  const defaultPort = secure ? "443" : "80";
  const portSuffix = port && /^\d+$/.test(port) && port !== defaultPort ? `:${port}` : "";

  return `${secure ? "wss" : "ws"}://${host}${portSuffix}`;
}

export function contentSecurityPolicy(env: SecurityHeadersEnv): string {
  const api = origin(env.apiBaseUrl);
  const reverb = reverbSource(env);
  const sources = (...values: (string | null | false)[]) =>
    values.filter((value): value is string => Boolean(value)).join(" ");

  const directives: [string, string][] = [
    ["default-src", "'self'"],
    [
      "script-src",
      sources(
        "'self'",
        "'unsafe-inline'",
        // React needs eval for its development tooling only.
        !env.production && "'unsafe-eval'",
        META_PIXEL_SCRIPT,
        GOOGLE_IDENTITY,
      ),
    ],
    ["style-src", sources("'self'", "'unsafe-inline'", GOOGLE_IDENTITY)],
    ["img-src", sources("'self'", "data:", "blob:", CDN, api, META_PIXEL_ENDPOINT)],
    ["font-src", "'self' data:"],
    [
      "connect-src",
      sources(
        "'self'",
        api,
        reverb,
        // Hot reload socket of the development server.
        !env.production && "ws:",
        META_PIXEL_SCRIPT,
        META_PIXEL_ENDPOINT,
        GOOGLE_IDENTITY,
        GEOCODER,
      ),
    ],
    ["frame-src", GOOGLE_IDENTITY],
    ["media-src", sources("'self'", "blob:", CDN, api)],
    ["worker-src", "'self' blob:"],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
    ["report-uri", CSP_REPORT_PATH],
  ];

  if (env.production) directives.push(["upgrade-insecure-requests", ""]);

  return directives
    .map(([name, value]) => (value ? `${name} ${value}` : name))
    .join("; ");
}

export function securityHeaders(env: SecurityHeadersEnv): HeaderEntry[] {
  const headers: HeaderEntry[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    // Google sign-in opens a popup that must keep a handle on this window.
    { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    {
      key: "Permissions-Policy",
      // Geolocation stays available to the site itself: the address form and
      // the pre-launch seller form locate the visitor on request.
      value:
        "accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(self), " +
        "gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), usb=(), " +
        "browsing-topics=()",
    },
    {
      key: env.enforceCsp ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
      value: contentSecurityPolicy(env),
    },
  ];

  if (env.production) {
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" });
  }

  return headers;
}
