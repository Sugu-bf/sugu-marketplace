/**
 * React Query defaults (audit M4): no retry on a client error, one retry on a
 * transient one, and every failed query logged once.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { makeQueryClient, shouldRetryQuery } from "@/lib/query-provider";
import { ApiError } from "@/lib/api/errors";

afterEach(() => vi.restoreAllMocks());

const error = (status: number, code: ApiError["code"], retryAfterMs?: number) =>
  new ApiError({ status, code, message: "", retryAfterMs });

describe("shouldRetryQuery", () => {
  it("never retries a client error", () => {
    expect(shouldRetryQuery(0, error(404, "NOT_FOUND"))).toBe(false);
    expect(shouldRetryQuery(0, error(422, "VALIDATION_ERROR"))).toBe(false);
    expect(shouldRetryQuery(0, error(429, "RATE_LIMITED", 1_000))).toBe(false);
  });

  it("retries a transient error once", () => {
    expect(shouldRetryQuery(0, error(503, "SERVER_ERROR"))).toBe(true);
    expect(shouldRetryQuery(0, error(0, "NETWORK_ERROR"))).toBe(true);
    expect(shouldRetryQuery(1, error(503, "SERVER_ERROR"))).toBe(false);
  });

  it("does not retry what is not an API error", () => {
    expect(shouldRetryQuery(0, new TypeError("x is undefined"))).toBe(false);
  });
});

describe("makeQueryClient", () => {
  it("logs a failed query with its scope and code", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = makeQueryClient();

    await client
      .fetchQuery({
        queryKey: ["favorites", "ids"],
        queryFn: () => Promise.reject(error(404, "NOT_FOUND")),
        retry: false,
      })
      .catch(() => {});

    expect(log).toHaveBeenCalledWith("[query] favorites failed: NOT_FOUND 404", "");
  });
});
