/**
 * next.config — the image optimizer, the response fingerprint (audit P0-4)
 * and the security headers sent with every route (audit P1-12).
 *
 * Until Next is upgraded past the advisories, the optimizer must never encode
 * AVIF, must only fetch from the hosts the site really serves images from, and
 * no response may advertise the framework.
 */
import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

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
});
