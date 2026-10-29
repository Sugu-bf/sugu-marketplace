/**
 * The client's request policy (audit P1-10, M4):
 * - no random X-Request-Id on server reads the Next data cache serves;
 * - bounded retries: never a 4xx, a 429 only with a short Retry-After, never a
 *   server-side timeout;
 * - an aborted caller is honoured and its signal does not collect listeners.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, parseRetryAfter } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { buildApiUrl } from "@/lib/api/endpoints";

const mockFetch = vi.fn();
const url = buildApiUrl("/api/v1/public/test");

function jsonResponse(status: number, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ ok: status < 400 }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function sentHeaders(call = 0): Headers {
  return mockFetch.mock.calls[call][1].headers as Headers;
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("X-Request-Id on the server", () => {
  it("is left off reads the data cache serves", async () => {
    mockFetch.mockImplementation(async () => jsonResponse(200));

    await api.get(url, { revalidate: 300 });
    await api.get(url, { revalidate: false });
    await api.get(url, { tags: ["products"] });
    await api.get(url, { cache: "force-cache" });

    for (let call = 0; call < 4; call++) {
      expect(sentHeaders(call).has("X-Request-Id")).toBe(false);
    }
  });

  it("is kept on uncached reads and on mutations", async () => {
    mockFetch.mockImplementation(async () => jsonResponse(200));

    await api.get(url, { revalidate: 0 });
    await api.get(url);
    await api.post(url, { body: { a: 1 } });
    // no-store wins over revalidate: false, as it does in Next.
    await api.get(url, { cache: "no-store", revalidate: false });

    for (let call = 0; call < 4; call++) {
      expect(sentHeaders(call).get("X-Request-Id")).toBeTruthy();
    }
  });
});

describe("retries", () => {
  it("never retries a 4xx", async () => {
    mockFetch.mockImplementation(async () => jsonResponse(404));

    await expect(api.get(url, { retries: 2 })).rejects.toMatchObject({ status: 404 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 429 that does not say when", async () => {
    mockFetch.mockImplementation(async () => jsonResponse(429));

    await expect(api.get(url, { retries: 2 })).rejects.toMatchObject({ code: "RATE_LIMITED" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("waits out a short Retry-After, then retries", async () => {
    vi.useFakeTimers();
    mockFetch
      .mockResolvedValueOnce(jsonResponse(429, { "Retry-After": "2" }))
      .mockResolvedValueOnce(jsonResponse(200));

    const pending = api.get(url, { retries: 1 });
    await vi.advanceTimersByTimeAsync(1_999);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(pending).resolves.toMatchObject({ status: 200 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("gives up on a Retry-After too long to wait", async () => {
    mockFetch.mockImplementation(async () => jsonResponse(503, { "Retry-After": "120" }));

    await expect(api.get(url, { retries: 2 })).rejects.toMatchObject({
      status: 503,
      retryAfterMs: 120_000,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("retries a server read once by default", async () => {
    vi.useFakeTimers();
    mockFetch.mockImplementation(async () => jsonResponse(503));

    const pending = api.get(url);
    const outcome = expect(pending).rejects.toMatchObject({ status: 503 });
    await vi.runAllTimersAsync();
    await outcome;
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not retry a server-side timeout", async () => {
    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => {
          init.signal!.addEventListener("abort", () =>
            reject(new DOMException("TIMEOUT", "AbortError")),
          );
        }),
    );

    await expect(api.get(url, { timeout: 5, retries: 2 })).rejects.toMatchObject({
      code: "TIMEOUT",
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("abort signals", () => {
  it("does not call the network for an already aborted signal", async () => {
    const controller = new AbortController();
    controller.abort();

    const error = await api.get(url, { signal: controller.signal }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe("ABORTED");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("removes its listener from the caller's signal once settled", async () => {
    mockFetch.mockImplementation(async () => jsonResponse(200));
    const controller = new AbortController();
    const add = vi.spyOn(controller.signal, "addEventListener");
    const remove = vi.spyOn(controller.signal, "removeEventListener");

    await api.get(url, { signal: controller.signal });
    await api.get(url, { signal: controller.signal });

    expect(add).toHaveBeenCalledTimes(2);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove.mock.calls[0][1]).toBe(add.mock.calls[0][1]);
  });

  it("reports the caller's abort as ABORTED, not as a timeout", async () => {
    const controller = new AbortController();
    mockFetch.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => {
          init.signal!.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
          controller.abort();
        }),
    );

    await expect(api.get(url, { signal: controller.signal, retries: 2 })).rejects.toMatchObject({
      code: "ABORTED",
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("parseRetryAfter", () => {
  it("reads delta-seconds and HTTP dates", () => {
    const now = Date.parse("2026-10-29T10:00:00Z");
    expect(parseRetryAfter("3", now)).toBe(3_000);
    expect(parseRetryAfter("Thu, 29 Oct 2026 10:00:05 GMT", now)).toBe(5_000);
    expect(parseRetryAfter("Thu, 29 Oct 2026 09:00:00 GMT", now)).toBe(0);
  });

  it("ignores a missing or unreadable value", () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("soon")).toBeUndefined();
    expect(parseRetryAfter("-1")).toBeUndefined();
  });
});
