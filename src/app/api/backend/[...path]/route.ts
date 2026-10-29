import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api/config";
import { clientIpHeaders } from "@/lib/server/client-ip";
import { readCappedBody } from "@/lib/server/read-capped-body";
import { isSameOriginRequest } from "@/lib/server/same-origin";
import {
  AUTH_TOKEN_COOKIE,
  AUTH_TOKEN_EXPIRES_COOKIE,
  AUTH_TOKEN_MAX_AGE_SECONDS,
  defaultAuthTokenExpiresAt,
  isValidSanctumTokenFormat,
} from "@/lib/api/session";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

/** Laravel has this long to answer; the visitor leaving aborts the call too. */
const UPSTREAM_TIMEOUT_MS = 15_000;

/** A JSON (or form) body: far above any real payload of the site. */
const MAX_BODY_BYTES = 1024 * 1024;

/**
 * A multipart body: a message carries at most 5 attachments of 10 MB each
 * (messaging Composer), plus the multipart framing and the text fields.
 */
const MAX_UPLOAD_BODY_BYTES = 5 * 10 * 1024 * 1024 + 1024 * 1024;

const ALLOWED_RESPONSE_HEADERS = [
  "content-type",
  "etag",
  "x-request-id",
  "x-cart-token",
  "x-wishlist-token",
  // A file read through the relay (a message attachment): shown inline or
  // downloaded as Laravel decides, never sniffed into another type, and
  // sandboxed when opened on its own.
  "content-disposition",
  "x-content-type-options",
  "content-security-policy",
  // Given the length of the bytes actually relayed (see proxyToBackend).
  "content-length",
] as const;

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "if-none-match",
  "user-agent",
  "x-request-id",
  "x-cart-token",
  "x-wishlist-token",
  "x-idempotency-key",
] as const;

function isMutatingMethod(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function safeBackendUrl(pathSegments: string[] | undefined, search: string): URL | null {
  if (!pathSegments || pathSegments.length < 2) return null;
  if (pathSegments[0] !== "api" || pathSegments[1] !== "v1") return null;

  for (const segment of pathSegments) {
    if (!segment || segment === "." || segment === "..") return null;
    if (/[\x00-\x1F\x7F/\\]/.test(segment)) return null;
  }

  const url = new URL(`/${pathSegments.map(encodeURIComponent).join("/")}`, API_BASE_URL);
  url.search = search;
  return url;
}

async function buildForwardHeaders(request: NextRequest): Promise<Headers> {
  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  // The visitor's address, signed for Laravel's per-address limits (never the
  // x-forwarded-for chain itself, which the visitor can write).
  for (const [name, value] of Object.entries(await clientIpHeaders(request.headers))) {
    headers.set(name, value);
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  if (isValidSanctumTokenFormat(token)) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}

function copyResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();

  for (const name of ALLOWED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  headers.set("cache-control", "no-store");
  headers.set("vary", "Cookie");
  return headers;
}

function cookieMaxAge(expiresAt: string): number {
  const timestamp = Date.parse(expiresAt);
  if (!Number.isFinite(timestamp)) return AUTH_TOKEN_MAX_AGE_SECONDS;

  const seconds = Math.floor((timestamp - Date.now()) / 1000);
  return Math.max(1, Math.min(seconds, AUTH_TOKEN_MAX_AGE_SECONDS));
}

function secureCookie(request: NextRequest): boolean {
  return process.env.NODE_ENV === "production" || request.nextUrl.protocol === "https:";
}

function setSessionCookies(
  response: NextResponse,
  request: NextRequest,
  token: string,
  expiresAt: string
): void {
  response.cookies.set(AUTH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: secureCookie(request),
    sameSite: "lax",
    maxAge: cookieMaxAge(expiresAt),
    path: "/",
  });

  response.cookies.set(AUTH_TOKEN_EXPIRES_COOKIE, expiresAt, {
    httpOnly: false,
    secure: secureCookie(request),
    sameSite: "lax",
    maxAge: cookieMaxAge(expiresAt),
    path: "/",
  });
}

function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(AUTH_TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  response.cookies.set(AUTH_TOKEN_EXPIRES_COOKIE, "", {
    httpOnly: false,
    maxAge: 0,
    path: "/",
  });
}

function bodyObject(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  return payload as Record<string, unknown>;
}

function extractAndStripSession(payload: unknown): { token: string; expiresAt: string } | null {
  const root = bodyObject(payload);
  const data = bodyObject(root?.data);
  if (!data) return null;

  const token = data.token;
  if (!isValidSanctumTokenFormat(token)) return null;

  const expiresAt = typeof data.expires_at === "string"
    ? data.expires_at
    : defaultAuthTokenExpiresAt();

  delete data.token;
  data.expires_at = expiresAt;
  data.session_established = true;

  return { token, expiresAt };
}

function isWebAuthPath(pathSegments: string[]): boolean {
  return pathSegments[0] === "api"
    && pathSegments[1] === "v1"
    && pathSegments[2] === "web-auth";
}

function isLogoutPath(pathSegments: string[]): boolean {
  return isWebAuthPath(pathSegments) && pathSegments[3] === "logout";
}

function bodyLimit(request: NextRequest): number {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.toLowerCase().startsWith("multipart/form-data")
    ? MAX_UPLOAD_BODY_BYTES
    : MAX_BODY_BYTES;
}

function errorResponse(status: number, message: string): NextResponse {
  return NextResponse.json(
    { success: false, message },
    { status, headers: { "cache-control": "no-store" } },
  );
}

async function proxyToBackend(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  if (!isSameOriginRequest(request, { requireOrigin: isMutatingMethod(request.method) })) {
    return NextResponse.json({ success: false, message: "Forbidden origin." }, { status: 403 });
  }

  const { path = [] } = await context.params;
  const target = safeBackendUrl(path, request.nextUrl.search);

  if (!target) {
    return NextResponse.json({ success: false, message: "Invalid backend path." }, { status: 400 });
  }

  const method = request.method.toUpperCase();
  let body: Uint8Array<ArrayBuffer> | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const read = await readCappedBody(request, bodyLimit(request));
    if (!read) return errorResponse(413, "La requête est trop volumineuse.");
    body = read;
  }

  try {
    return await relay(request, path, target, method, body);
  } catch (error) {
    const name = error instanceof Error ? error.name : "UnknownError";
    console.error(`[bff] ${method} /${path.join("/")} failed: ${name}`);
    return name === "TimeoutError"
      ? errorResponse(504, "Le service met trop de temps à répondre. Réessayez.")
      : errorResponse(502, "Le service est momentanément indisponible. Réessayez.");
  }
}

async function relay(
  request: NextRequest,
  path: string[],
  target: URL,
  method: string,
  body: Uint8Array<ArrayBuffer> | undefined,
): Promise<NextResponse> {
  const upstream = await fetch(target, {
    method,
    headers: await buildForwardHeaders(request),
    body,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
  });

  const headers = copyResponseHeaders(upstream);
  const contentType = upstream.headers.get("content-type") ?? "";
  const shouldInspectJson = isWebAuthPath(path) && contentType.includes("application/json");

  let responseBody: BodyInit | null = null;
  let session: { token: string; expiresAt: string } | null = null;

  if (shouldInspectJson) {
    const text = await upstream.text();
    if (text.trim()) {
      try {
        const json = JSON.parse(text) as unknown;
        session = upstream.ok ? extractAndStripSession(json) : null;
        responseBody = JSON.stringify(json);
        headers.set("content-type", "application/json");
      } catch {
        responseBody = text;
      }
    }
  } else if (upstream.status !== 204 && upstream.status !== 304) {
    responseBody = await upstream.arrayBuffer();
  }

  // The length of what leaves here, never Laravel's word for it: fetch has
  // already decoded a compressed body, and a session reply is rewritten.
  if (responseBody instanceof ArrayBuffer) {
    headers.set("content-length", String(responseBody.byteLength));
  } else {
    headers.delete("content-length");
  }

  const response = new NextResponse(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });

  if (session) {
    setSessionCookies(response, request, session.token, session.expiresAt);
  }

  if (isLogoutPath(path) && upstream.status < 500) {
    clearSessionCookies(response);
  }

  return response;
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PUT = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;
