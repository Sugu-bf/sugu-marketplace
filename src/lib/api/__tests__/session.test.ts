import { describe, expect, it } from "vitest";
import {
  AUTH_TOKEN_MAX_AGE_SECONDS,
  defaultAuthTokenExpiresAt,
  isValidSanctumTokenFormat,
} from "@/lib/api/session";

describe("session helpers", () => {
  it("accepts Laravel Sanctum plain text token format only", () => {
    expect(isValidSanctumTokenFormat(`123|${"A".repeat(40)}`)).toBe(true);
    expect(isValidSanctumTokenFormat(`1|${"a1B2".repeat(10)}`)).toBe(true);

    expect(isValidSanctumTokenFormat("")).toBe(false);
    expect(isValidSanctumTokenFormat("token-without-id")).toBe(false);
    expect(isValidSanctumTokenFormat(`1|${"A".repeat(39)}`)).toBe(false);
    expect(isValidSanctumTokenFormat(`abc|${"A".repeat(40)}`)).toBe(false);
    expect(isValidSanctumTokenFormat(`1|${"A".repeat(39)}-`)).toBe(false);
  });

  it("defaults to the configured max-age window", () => {
    const before = Date.now();
    const expiresAt = Date.parse(defaultAuthTokenExpiresAt());
    const after = Date.now();

    expect(expiresAt).toBeGreaterThanOrEqual(before + AUTH_TOKEN_MAX_AGE_SECONDS * 1000);
    expect(expiresAt).toBeLessThanOrEqual(after + AUTH_TOKEN_MAX_AGE_SECONDS * 1000 + 1000);
  });
});
