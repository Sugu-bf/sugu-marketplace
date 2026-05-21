import { NextRequest, NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE, AUTH_TOKEN_EXPIRES_COOKIE } from "@/lib/api/session";

function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const expectedOrigin = request.nextUrl.origin;

  if (origin !== expectedOrigin) return false;

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
