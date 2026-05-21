import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api/config";
import { AUTH_TOKEN_COOKIE, isValidSanctumTokenFormat } from "@/lib/api/session";

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

  if (!isAllowedOrigin(origin)) return false;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;

  return true;
}

function isValidBroadcastPayload(payload: unknown): payload is {
  socket_id: string;
  channel_name: string;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return false;

  const body = payload as Record<string, unknown>;
  const socketId = body.socket_id;
  const channelName = body.channel_name;

  return typeof socketId === "string"
    && /^\d+\.\d+$/.test(socketId)
    && typeof channelName === "string"
    && channelName.length > 0
    && channelName.length <= 200
    && !/[\x00-\x1F\x7F]/.test(channelName);
}

function forwardHeaders(request: NextRequest, token: string): Headers {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  for (const name of ["accept-language", "user-agent", "x-request-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  return headers;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ message: "Forbidden origin." }, { status: 403 });
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  if (!isValidSanctumTokenFormat(token)) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }

  if (!isValidBroadcastPayload(payload)) {
    return NextResponse.json({ message: "Invalid channel authorization payload." }, { status: 422 });
  }

  const upstream = await fetch(new URL("/api/broadcasting/auth", API_BASE_URL), {
    method: "POST",
    headers: forwardHeaders(request, token),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await upstream.text();
  const headers = new Headers({
    "cache-control": "no-store",
    "content-type": upstream.headers.get("content-type") ?? "application/json",
  });

  return new NextResponse(text, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
