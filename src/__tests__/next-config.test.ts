/**
 * next.config — the image optimizer, the response fingerprint (audit P0-4)
 * and the security headers sent with every route (audit P1-12).
 *
 * Until Next is upgraded past the advisories, the optimizer must never encode
 * AVIF, must only fetch from the hosts the site really serves images from, and
 * no response may advertise the framework.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD } from "next/constants";
import config from "../../next.config";

const nextConfig = config(PHASE_DEVELOPMENT_SERVER);

const COMPLETE_BUILD_ENV = {
  NEXT_PUBLIC_API_BASE_URL: "https://api.mysugu.com",
  NEXT_PUBLIC_APP_URL: "https://sugu.pro",
  NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB: "123-abc.apps.googleusercontent.com",
  NEXT_PUBLIC_REVERB_APP_KEY: "public-key",
  NEXT_PUBLIC_REVERB_HOST: "ws.mysugu.com",
  NEXT_PUBLIC_REVERB_PORT: "443",
  NEXT_PUBLIC_REVERB_SCHEME: "https",
};

afterEach(() => vi.unstubAllEnvs());

describe("next.config", () => {
  it("never encodes AVIF in the image optimizer", () => {
    expect(nextConfig.images?.formats).toEqual(["image/webp"]);
  });

  it("only optimizes images from the CDN and the API host", () => {
    const hosts = nextConfig.images?.remotePatterns?.map((pattern) => pattern.hostname);
    expect(hosts).toEqual(["cdn.sugu.pro", "api.mysugu.com"]);
  });

  it("sends the security headers with every route", async () => {
    const rules = await nextConfig.headers!();
    const everyRoute = rules.find((rule) => rule.source === "/:path*");
    expect(everyRoute?.headers.map((entry) => entry.key)).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options",
        "Referrer-Policy",
        "X-Frame-Options",
        "Permissions-Policy",
        "Content-Security-Policy-Report-Only",
      ]),
    );
  });

  it("fixes the coming-soon flag at build time, off unless explicitly on", () => {
    expect(nextConfig.env?.COMING_SOON_ENABLED).toBe(
      process.env.COMING_SOON_ENABLED === "true" ? "true" : "false",
    );
  });

  it("does not announce the framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("fails a production build on an incomplete environment (audit P1-13)", () => {
    for (const [name, value] of Object.entries(COMPLETE_BUILD_ENV)) vi.stubEnv(name, value);
    expect(() => config(PHASE_PRODUCTION_BUILD)).not.toThrow();

    vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB", "");
    expect(() => config(PHASE_PRODUCTION_BUILD)).toThrow(/NEXT_PUBLIC_GOOGLE_CLIENT_ID_WEB: is required/);
  });
});
