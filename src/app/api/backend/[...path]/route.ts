import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api/config";
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

const ALLOWED_RESPONSE_HEADERS = [
  "content-type",
  "x-request-id",
  "x-cart-token",
  "x-wishlist-token",
] as const;

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "content-type",
  "user-agent",
  "x-request-id",
  "x-cart-token",
  "x-wishlist-token",
  "x-idempotency-key",
] as const;

function isMutatingMethod(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;

  // Helper to verify if the origin matches any of our allowed origins
  const isAllowedOrigin = (originValue: string | null): boolean => {
    if (!originValue) return false;
    if (originValue === expectedOrigin) return true;

    // Check NEXT_PUBLIC_APP_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      try {
        if (originValue === new URL(appUrl).origin) return true;
      } catch {}
    }

    // Check X-Forwarded headers (from reverse proxies)
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "http";
    if (forwardedHost) {
      const reconstructedOrigin = `${forwardedProto}://${forwardedHost}`;
      if (originValue === reconstructedOrigin) return true;
    }

    // In development, allow localhost/127.0.0.1/[::1] mismatches
    if (process.env.NODE_ENV !== "production") {
      try {
        const originUrl = new URL(originValue);
        const expectedUrl = new URL(expectedOrigin);
        const isLocalhost = (host: string) =>
          host === "localhost" || host === "127.0.0.1" || host === "[::1]";
        if (isLocalhost(originUrl.hostname) && isLocalhost(expectedUrl.hostname)) {
          return true;
        }
      } catch {}
    }

    return false;
  };

  if (origin && !isAllowedOrigin(origin)) return false;
  if (isMutatingMethod(request.method) && !isAllowedOrigin(origin)) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  return true;
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

function buildForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
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

async function proxyToBackend(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, message: "Forbidden origin." }, { status: 403 });
  }

  const { path = [] } = await context.params;
  const target = safeBackendUrl(path, request.nextUrl.search);

  if (!target) {
    return NextResponse.json({ success: false, message: "Invalid backend path." }, { status: 400 });
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const upstream = await fetch(target, {
    method,
    headers: buildForwardHeaders(request),
    body: hasBody ? await request.arrayBuffer() : undefined,
    cache: "no-store",
    redirect: "manual",
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
