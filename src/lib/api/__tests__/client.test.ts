/**
 * Tests for lib/api/client.ts — Central API client
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { buildApiUrl } from "@/lib/api/endpoints";
import { z } from "zod";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("api.get", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should make a GET request and return data", async () => {
    const mockData = { items: [{ id: "1", name: "Test" }] };
    mockFetch.mockResolvedValueOnce(jsonResponse(mockData));

    const url = buildApiUrl("/v1/public/categories");
    const result = await api.get<typeof mockData>(url);

    expect(result.data).toEqual(mockData);
    expect(result.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("should include Accept: application/json header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await api.get(buildApiUrl("/v1/test"));

    const call = mockFetch.mock.calls[0];
    const headers = call[1]?.headers;
    expect(headers.get("Accept")).toBe("application/json");
  });

  it("should include X-Request-Id header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await api.get(buildApiUrl("/v1/test"));

    const call = mockFetch.mock.calls[0];
    const headers = call[1]?.headers;
    expect(headers.get("X-Request-Id")).toBeTruthy();
  });

  it("should use a custom requestId when provided", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    const result = await api.get(buildApiUrl("/v1/test"), { requestId: "custom-id" });

    const call = mockFetch.mock.calls[0];
    const headers = call[1]?.headers;
    expect(headers.get("X-Request-Id")).toBe("custom-id");
    expect(result.requestId).toBe("custom-id");
  });

  it("should throw ApiError on 404", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: "Not found" }, 404)
    );

    let caught: ApiError | undefined;
    try {
      await api.get(buildApiUrl("/v1/not-found"));
    } catch (e) {
      caught = e as ApiError;
    }

    expect(caught).toBeInstanceOf(ApiError);
    expect(caught!.code).toBe("NOT_FOUND");
    expect(caught!.status).toBe(404);
  });

  it("should throw ApiError on 500", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: "Server error" }, 500)
    );

    await expect(api.get(buildApiUrl("/v1/fail"))).rejects.toThrow(ApiError);
  });

  it("should throw NETWORK_ERROR on fetch failure", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    try {
      await api.get(buildApiUrl("/v1/test"));
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).code).toBe("NETWORK_ERROR");
      expect((e as ApiError).status).toBe(0);
    }
  });

  it("should validate response with Zod schema", async () => {
    const schema = z.object({
      items: z.array(z.object({ id: z.string() })),
    });

    mockFetch.mockResolvedValueOnce(
      jsonResponse({ items: [{ id: "1" }] })
    );

    const result = await api.get(buildApiUrl("/v1/test"), { schema });
    expect(result.data.items[0].id).toBe("1");
  });

  it("should throw INVALID_SCHEMA when Zod validation fails", async () => {
    const schema = z.object({
      items: z.array(z.object({ id: z.number() })), // Expect number, but response has string
    });

    mockFetch.mockResolvedValueOnce(
      jsonResponse({ items: [{ id: "not-a-number" }] })
    );

    try {
      await api.get(buildApiUrl("/v1/test"), { schema });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).code).toBe("INVALID_SCHEMA");
    }
  });

  it("should include credentials by default", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await api.get(buildApiUrl("/v1/test"));

    const call = mockFetch.mock.calls[0];
    expect(call[1]?.credentials).toBe("include");
  });

  it("should skip credentials when skipCredentials is true", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));

    await api.get(buildApiUrl("/v1/public/test"), { skipCredentials: true });

    const call = mockFetch.mock.calls[0];
    expect(call[1]?.credentials).toBeUndefined();
  });

  it("should retry on retryable errors for GET requests", async () => {
    // First call: 503  →  Second call: 200
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ message: "Service Unavailable" }, 503))
      .mockResolvedValueOnce(jsonResponse({ items: [] }));

    const result = await api.get<{ items: unknown[] }>(buildApiUrl("/v1/test"), {
      retries: 1,
    });

    expect(result.data.items).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

describe("api.post", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should make a POST request with JSON body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    const result = await api.post(buildApiUrl("/v1/cart/add"), {
      body: { product_id: "123", quantity: 2 },
    });

    expect(result.data).toEqual({ success: true });

    const call = mockFetch.mock.calls[0];
    expect(call[1]?.method).toBe("POST");
    expect(call[1]?.headers.get("Content-Type")).toBe("application/json");
  });

  it("should NOT retry POST requests by default", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: "Server error" }, 503)
    );

    await expect(
      api.post(buildApiUrl("/v1/checkout"), { body: { items: [] } })
    ).rejects.toThrow(ApiError);

    expect(mockFetch).toHaveBeenCalledTimes(1); // No retries
  });
});
