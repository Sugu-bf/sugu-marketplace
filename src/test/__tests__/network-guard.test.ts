/**
 * The global network guard (audit M7): a test without a mock never reaches a
 * Sugu host.
 */
import { describe, it, expect } from "vitest";
import { isGuardedUrl } from "@/test/network-guard";

describe("network guard", () => {
  it("is installed for every test file", async () => {
    await expect(fetch("https://api.mysugu.com/api/v1/public/categories")).rejects.toThrow(
      /network-guard.*blocked/,
    );
  });

  it("guards the Sugu hosts only", () => {
    expect(isGuardedUrl("https://api.mysugu.com/api/v1/x")).toBe(true);
    expect(isGuardedUrl("https://ws-zk47m.mysugu.com")).toBe(true);
    expect(isGuardedUrl(new URL("https://sugu.pro/"))).toBe(true);
    expect(isGuardedUrl(new Request("https://cdn.sugu.pro/a.png"))).toBe(true);

    expect(isGuardedUrl("https://notmysugu.com/")).toBe(false);
    expect(isGuardedUrl("https://example.test/")).toBe(false);
    expect(isGuardedUrl("/relative")).toBe(false);
  });
});
