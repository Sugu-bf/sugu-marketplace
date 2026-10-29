/**
 * SEO redirect resolution (audit M3): one backend lookup per path, a bounded
 * cache keyed on the pathname, only relative destinations, no visitor address
 * relayed as written by the visitor.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CACHE_TTL_MS,
  LruCache,
  __clearSeoRedirectCache,
  redirectTarget,
  resolveSeoRedirect,
} from "@/lib/routing/seo-redirects";

const API = "https://api.sugu.test";

function backendAnswers(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => __clearSeoRedirectCache());
afterEach(() => vi.unstubAllGlobals());

describe("resolveSeoRedirect", () => {
  it("returns the backend rule and asks only once per path", async () => {
    const fetchMock = backendAnswers({ match: true, to: "/category/fruits", status_code: 301 });

    const first = await resolveSeoRedirect("/fruits", { apiBaseUrl: API });
    const second = await resolveSeoRedirect("/fruits", { apiBaseUrl: API });

    expect(first).toEqual({ destination: "/category/fruits", statusCode: 301 });
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe(`${API}/api/v1/public/redirects/resolve?path=%2Ffruits`);
    expect(new Headers(init.headers).has("x-forwarded-for")).toBe(false);
  });

  it("asks again once the answer is older than the TTL", async () => {
    const fetchMock = backendAnswers({ match: false });
    let now = 1_000;

    await resolveSeoRedirect("/x", { apiBaseUrl: API, now: () => now });
    now += CACHE_TTL_MS + 1;
    await resolveSeoRedirect("/x", { apiBaseUrl: API, now: () => now });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps a 302 and turns any other status into a 301", async () => {
    backendAnswers({ match: true, to: "/a", status_code: 302 });
    expect((await resolveSeoRedirect("/temp", { apiBaseUrl: API }))?.statusCode).toBe(302);

    backendAnswers({ match: true, to: "/a", status_code: 307 });
    expect((await resolveSeoRedirect("/other", { apiBaseUrl: API }))?.statusCode).toBe(301);
  });

  it.each(["https://evil.test/", "//evil.test", "/\\evil.test", "/a\nb"])(
    "refuses the destination %j",
    async (to) => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      backendAnswers({ match: true, to });
      expect(await resolveSeoRedirect("/bad", { apiBaseUrl: API })).toBeNull();
    },
  );

  it("treats a failing backend as no redirect, and remembers it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    vi.stubGlobal("fetch", failing);

    expect(await resolveSeoRedirect("/down", { apiBaseUrl: API })).toBeNull();
    expect(await resolveSeoRedirect("/down", { apiBaseUrl: API })).toBeNull();
    expect(failing).toHaveBeenCalledTimes(1);

    const fetchMock = backendAnswers({}, 500);
    expect(await resolveSeoRedirect("/error", { apiBaseUrl: API })).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("redirectTarget", () => {
  it("keeps the visitor's query when the rule has none", () => {
    const target = redirectTarget(
      { destination: "/category/fruits", statusCode: 301 },
      "https://sugu.pro/fruits?utm_source=x",
    );
    expect(target.toString()).toBe("https://sugu.pro/category/fruits?utm_source=x");
  });

  it("keeps the rule's own query", () => {
    const target = redirectTarget(
      { destination: "/search?q=fruits", statusCode: 301 },
      "https://sugu.pro/fruits?utm_source=x",
    );
    expect(target.toString()).toBe("https://sugu.pro/search?q=fruits");
  });
});

describe("LruCache", () => {
  it("evicts the least recently used entry past its bound", () => {
    const cache = new LruCache<number>(2);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);

    expect(cache.size).toBe(2);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });
});
