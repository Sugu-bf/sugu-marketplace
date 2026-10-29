/**
 * next.config — the image optimizer and the response fingerprint (audit P0-4).
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

  it("does not announce the framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
