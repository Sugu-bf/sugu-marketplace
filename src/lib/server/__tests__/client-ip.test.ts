/**
 * The signed visitor address (audit P1-3): read from x-forwarded-for the way
 * Laravel reads it, never from what the visitor wrote, and signed so Laravel
 * can trust it. The signature vector is shared with Laravel's
 * TrustSuguEdgeClientIpTest.
 */
import { describe, it, expect } from "vitest";
import {
  clientIpFromForwardedFor,
  clientIpHeaders,
  normalizeIp,
  signClientIp,
  trustedProxies,
} from "@/lib/server/client-ip";

const SECRET = "0123456789abcdef0123456789abcdef";
const CLOUDFLARE_EDGE = "172.70.1.2";

describe("normalizeIp", () => {
  it.each([
    ["41.203.64.10", "41.203.64.10"],
    [" 41.203.64.10 ", "41.203.64.10"],
    ["41.203.64.10:5678", "41.203.64.10"],
    ["[2001:DB8::1]:443", "2001:db8::1"],
    ["::ffff:41.203.64.10", "41.203.64.10"],
    ["2001:db8:0:0:0:0:0:1", "2001:db8:0:0:0:0:0:1"],
  ])("reads %j as %j", (entry, ip) => {
    expect(normalizeIp(entry)).toBe(ip);
  });

  it.each(["", "unknown", "256.1.1.1", "01.2.3.4", "1.2.3", "2001:db8::1::2", "1:2:3:4:5:6:7:8:9", "<script>"])(
    "refuses %j",
    (entry) => {
      expect(normalizeIp(entry)).toBeNull();
    },
  );
});

describe("clientIpFromForwardedFor", () => {
  const cloudflareOnly = trustedProxies({});

  it("takes the rightmost entry when nothing trusted sits in front", () => {
    expect(clientIpFromForwardedFor("41.203.64.10", cloudflareOnly)).toBe("41.203.64.10");
  });

  it("skips the Cloudflare edge the platform proxy saw", () => {
    expect(clientIpFromForwardedFor(`41.203.64.10, ${CLOUDFLARE_EDGE}`, cloudflareOnly)).toBe(
      "41.203.64.10",
    );
  });

  it("never reads what the visitor wrote on the left", () => {
    expect(
      clientIpFromForwardedFor(`198.18.0.9, 41.203.64.10, ${CLOUDFLARE_EDGE}`, cloudflareOnly),
    ).toBe("41.203.64.10");
  });

  it("does not let a visitor posing as Cloudflare pass a written address", () => {
    // The visitor connects straight to the platform proxy and writes a chain
    // ending in a Cloudflare address: the proxy still appends the real one.
    expect(
      clientIpFromForwardedFor(`198.18.0.9, ${CLOUDFLARE_EDGE}, 41.203.64.10`, cloudflareOnly),
    ).toBe("41.203.64.10");
  });

  it("gives up on an unreadable hop or an all-trusted chain", () => {
    expect(clientIpFromForwardedFor(`41.203.64.10, garbage, ${CLOUDFLARE_EDGE}`, cloudflareOnly)).toBeNull();
    expect(clientIpFromForwardedFor(CLOUDFLARE_EDGE, cloudflareOnly)).toBeNull();
    expect(clientIpFromForwardedFor(null, cloudflareOnly)).toBeNull();
    expect(clientIpFromForwardedFor("", cloudflareOnly)).toBeNull();
  });

  it("skips the extra proxies configured, but never a wildcard", () => {
    const withPlatform = trustedProxies({ TRUSTED_PROXIES_EXTRA: "10.0.0.0/8, 2001:db8::/32" });
    expect(clientIpFromForwardedFor("41.203.64.10, 10.0.3.7", withPlatform)).toBe("41.203.64.10");
    expect(clientIpFromForwardedFor("41.203.64.10, 2001:db8::7", withPlatform)).toBe("41.203.64.10");

    const wildcard = trustedProxies({ TRUSTED_PROXIES_EXTRA: "*" });
    expect(clientIpFromForwardedFor("198.18.0.9, 10.0.3.7", wildcard)).toBe("10.0.3.7");
  });

  it("replaces the Cloudflare default when TRUSTED_PROXIES is set", () => {
    const own = trustedProxies({ TRUSTED_PROXIES: "192.0.2.0/24" });
    expect(clientIpFromForwardedFor(`41.203.64.10, ${CLOUDFLARE_EDGE}`, own)).toBe(CLOUDFLARE_EDGE);
    expect(clientIpFromForwardedFor("41.203.64.10, 192.0.2.5", own)).toBe("41.203.64.10");
  });
});

describe("signClientIp", () => {
  it("is the hex HMAC-SHA256 of '<ip>|<ts>', as Laravel computes it", async () => {
    expect(await signClientIp("41.203.64.10", 1_793_000_000, SECRET)).toBe(
      "a5f7dc6f3f8be6da75182a00144ec1c36f4d9da405c08b99f51ed6815171bf1f",
    );
  });
});

describe("clientIpHeaders", () => {
  const request = new Headers({ "x-forwarded-for": `198.18.0.9, 41.203.64.10, ${CLOUDFLARE_EDGE}` });

  it("signs the visitor's address with the current second", async () => {
    const headers = await clientIpHeaders(request, { SUGU_EDGE_SECRET: SECRET }, 1_793_000_000_999);

    expect(headers).toEqual({
      "X-Sugu-Client-IP": "41.203.64.10",
      "X-Sugu-Client-IP-Ts": "1793000000",
      "X-Sugu-Client-IP-Sig": "a5f7dc6f3f8be6da75182a00144ec1c36f4d9da405c08b99f51ed6815171bf1f",
    });
  });

  it("sends nothing without a secret, or with one too short", async () => {
    expect(await clientIpHeaders(request, {})).toEqual({});
    expect(await clientIpHeaders(request, { SUGU_EDGE_SECRET: "short" })).toEqual({});
  });

  it("sends nothing when no address can be told", async () => {
    expect(await clientIpHeaders(new Headers(), { SUGU_EDGE_SECRET: SECRET })).toEqual({});
  });
});
