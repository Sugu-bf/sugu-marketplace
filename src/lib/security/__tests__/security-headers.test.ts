/**
 * Security headers (audit P1-12): what every response carries, and the
 * Content-Security-Policy the browsers report against.
 */
import { describe, it, expect } from "vitest";
import {
  contentSecurityPolicy,
  securityHeaders,
  type SecurityHeadersEnv,
} from "@/lib/security/security-headers";

const PROD: SecurityHeadersEnv = {
  production: true,
  enforceCsp: false,
  apiBaseUrl: "https://api.mysugu.com/",
  reverbHost: "ws.mysugu.com",
  reverbPort: "443",
  reverbScheme: "https",
};

function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy.split("; ").map((directive) => {
      const [name, ...values] = directive.split(" ");
      return [name, values];
    }),
  );
}

function header(env: SecurityHeadersEnv, key: string): string | undefined {
  return securityHeaders(env).find((entry) => entry.key === key)?.value;
}

describe("securityHeaders", () => {
  it("sends the fixed hardening headers", () => {
    expect(header(PROD, "X-Content-Type-Options")).toBe("nosniff");
    expect(header(PROD, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header(PROD, "X-Frame-Options")).toBe("DENY");
    expect(header(PROD, "Permissions-Policy")).toContain("camera=()");
    expect(header(PROD, "Permissions-Policy")).toContain("geolocation=(self)");
  });

  it("pins HTTPS in production only", () => {
    expect(header(PROD, "Strict-Transport-Security")).toBe("max-age=31536000; includeSubDomains");
    expect(header({ ...PROD, production: false }, "Strict-Transport-Security")).toBeUndefined();
  });

  it("reports the policy without enforcing it until CSP_ENFORCE is set", () => {
    expect(header(PROD, "Content-Security-Policy-Report-Only")).toBeDefined();
    expect(header(PROD, "Content-Security-Policy")).toBeUndefined();

    const enforced = { ...PROD, enforceCsp: true };
    expect(header(enforced, "Content-Security-Policy")).toBe(contentSecurityPolicy(enforced));
    expect(header(enforced, "Content-Security-Policy-Report-Only")).toBeUndefined();
  });
});

describe("contentSecurityPolicy", () => {
  it("forbids framing, plugins, foreign bases and foreign form targets", () => {
    const policy = directives(contentSecurityPolicy(PROD));
    expect(policy.get("frame-ancestors")).toEqual(["'none'"]);
    expect(policy.get("object-src")).toEqual(["'none'"]);
    expect(policy.get("base-uri")).toEqual(["'self'"]);
    expect(policy.get("form-action")).toEqual(["'self'"]);
    expect(policy.get("report-uri")).toEqual(["/api/csp-report"]);
    expect(policy.has("upgrade-insecure-requests")).toBe(true);
  });

  it("allows scripts only from the site, Meta Pixel and Google sign-in", () => {
    const scripts = directives(contentSecurityPolicy(PROD)).get("script-src");
    expect(scripts).toEqual([
      "'self'",
      "'unsafe-inline'",
      "https://connect.facebook.net",
      "https://accounts.google.com",
    ]);
  });

  it("lets the page reach the API, the realtime socket and the CDN", () => {
    const policy = directives(contentSecurityPolicy(PROD));
    expect(policy.get("connect-src")).toEqual(
      expect.arrayContaining(["'self'", "https://api.mysugu.com", "wss://ws.mysugu.com"]),
    );
    expect(policy.get("img-src")).toEqual(
      expect.arrayContaining(["https://cdn.sugu.pro", "https://api.mysugu.com"]),
    );
  });

  it("names a non-default socket port and a plain socket outside TLS", () => {
    const policy = directives(
      contentSecurityPolicy({
        ...PROD,
        reverbHost: "ws.staging.test",
        reverbPort: "8080",
        reverbScheme: "http",
      }),
    );
    expect(policy.get("connect-src")).toContain("ws://ws.staging.test:8080");
  });

  it("drops a socket host that could smuggle another directive", () => {
    const policy = contentSecurityPolicy({ ...PROD, reverbHost: "evil.test; script-src *" });
    expect(policy).not.toContain("evil.test");
  });

  it("allows eval and the hot reload socket in development only", () => {
    const dev = directives(contentSecurityPolicy({ ...PROD, production: false }));
    expect(dev.get("script-src")).toContain("'unsafe-eval'");
    expect(dev.get("connect-src")).toContain("ws:");
    expect(dev.has("upgrade-insecure-requests")).toBe(false);

    const prod = directives(contentSecurityPolicy(PROD));
    expect(prod.get("script-src")).not.toContain("'unsafe-eval'");
    expect(prod.get("connect-src")).not.toContain("ws:");
  });
});
