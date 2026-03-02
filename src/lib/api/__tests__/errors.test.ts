/**
 * Tests for lib/api/errors.ts — ApiError class
 */
import { describe, it, expect } from "vitest";
import { ApiError, httpStatusToErrorCode, isApiError } from "@/lib/api/errors";

describe("ApiError", () => {
  it("should create an error with correct properties", () => {
    const error = new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      details: { errors: { email: ["Required"] } },
      requestId: "req-123",
    });

    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid input");
    expect(error.details?.errors).toEqual({ email: ["Required"] });
    expect(error.requestId).toBe("req-123");
  });

  it("should identify client errors (4xx)", () => {
    const error = new ApiError({ status: 404, code: "NOT_FOUND", message: "Not found" });
    expect(error.isClientError).toBe(true);
    expect(error.isServerError).toBe(false);
    expect(error.isNetworkError).toBe(false);
  });

  it("should identify server errors (5xx)", () => {
    const error = new ApiError({ status: 500, code: "SERVER_ERROR", message: "Server error" });
    expect(error.isClientError).toBe(false);
    expect(error.isServerError).toBe(true);
  });

  it("should identify network errors (status 0)", () => {
    const error = new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Network error" });
    expect(error.isNetworkError).toBe(true);
    expect(error.isRetryable).toBe(true);
  });

  it("should identify retryable errors", () => {
    expect(
      new ApiError({ status: 0, code: "TIMEOUT", message: "" }).isRetryable
    ).toBe(true);
    expect(
      new ApiError({ status: 429, code: "RATE_LIMITED", message: "" }).isRetryable
    ).toBe(true);
    expect(
      new ApiError({ status: 503, code: "SERVER_ERROR", message: "" }).isRetryable
    ).toBe(true);
    expect(
      new ApiError({ status: 404, code: "NOT_FOUND", message: "" }).isRetryable
    ).toBe(false);
  });

  it("should return user-friendly action hints", () => {
    const error = new ApiError({ status: 401, code: "UNAUTHORIZED", message: "" });
    expect(error.userAction).toContain("reconnecter");
  });

  it("should serialize safely (no secrets)", () => {
    const error = new ApiError({
      status: 500,
      code: "SERVER_ERROR",
      message: "Something broke",
      requestId: "req-456",
    });
    const json = error.toJSON();
    expect(json).toEqual({
      name: "ApiError",
      status: 500,
      code: "SERVER_ERROR",
      message: "Something broke",
      details: undefined,
      requestId: "req-456",
    });
  });
});

describe("httpStatusToErrorCode", () => {
  it("should map 401 to UNAUTHORIZED", () => {
    expect(httpStatusToErrorCode(401)).toBe("UNAUTHORIZED");
  });

  it("should map 403 to FORBIDDEN", () => {
    expect(httpStatusToErrorCode(403)).toBe("FORBIDDEN");
  });

  it("should map 404 to NOT_FOUND", () => {
    expect(httpStatusToErrorCode(404)).toBe("NOT_FOUND");
  });

  it("should map 419 to CSRF_MISMATCH", () => {
    expect(httpStatusToErrorCode(419)).toBe("CSRF_MISMATCH");
  });

  it("should map 422 to VALIDATION_ERROR", () => {
    expect(httpStatusToErrorCode(422)).toBe("VALIDATION_ERROR");
  });

  it("should map 429 to RATE_LIMITED", () => {
    expect(httpStatusToErrorCode(429)).toBe("RATE_LIMITED");
  });

  it("should map 500+ to SERVER_ERROR", () => {
    expect(httpStatusToErrorCode(500)).toBe("SERVER_ERROR");
    expect(httpStatusToErrorCode(502)).toBe("SERVER_ERROR");
    expect(httpStatusToErrorCode(503)).toBe("SERVER_ERROR");
  });

  it("should map unknown status to UNKNOWN", () => {
    expect(httpStatusToErrorCode(418)).toBe("UNKNOWN");
  });
});

describe("isApiError", () => {
  it("should return true for ApiError instances", () => {
    expect(isApiError(new ApiError({ status: 500, code: "SERVER_ERROR", message: "" }))).toBe(true);
  });

  it("should return false for regular errors", () => {
    expect(isApiError(new Error("test"))).toBe(false);
  });

  it("should return false for non-error values", () => {
    expect(isApiError(null)).toBe(false);
    expect(isApiError("string")).toBe(false);
    expect(isApiError(42)).toBe(false);
  });
});
