export const AUTH_TOKEN_COOKIE = "auth_token";
export const AUTH_TOKEN_EXPIRES_COOKIE = "auth_token_expires_at";
export const AUTH_TOKEN_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export function defaultAuthTokenExpiresAt(): string {
  return new Date(Date.now() + AUTH_TOKEN_MAX_AGE_SECONDS * 1000).toISOString();
}

// "{id}|{SANCTUM_TOKEN_PREFIX}{random}{crc32}": the prefix the backend may be
// configured with (e.g. "sugu_") is part of the plain-text token.
export function isValidSanctumTokenFormat(token: unknown): token is string {
  return typeof token === "string" && /^\d+\|[A-Za-z0-9_-]{0,32}[A-Za-z0-9]{40,128}$/.test(token);
}
