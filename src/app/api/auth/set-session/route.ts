import { NextRequest, NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE, AUTH_TOKEN_EXPIRES_COOKIE } from "@/lib/api/session";

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

export function POST() {
  return NextResponse.json(
    { success: false, message: "Session establishment must go through the backend proxy." },
    { status: 405, headers: { Allow: "DELETE" } }
  );
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, message: "Forbidden origin." }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });

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

  return response;
}
