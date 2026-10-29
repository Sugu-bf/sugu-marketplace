import { NextRequest, NextResponse } from "next/server";
import { AUTH_TOKEN_COOKIE, AUTH_TOKEN_EXPIRES_COOKIE } from "@/lib/api/session";
import { isSameOriginRequest } from "@/lib/server/same-origin";

export function POST() {
  return NextResponse.json(
    { success: false, message: "Session establishment must go through the backend proxy." },
    { status: 405, headers: { Allow: "DELETE" } }
  );
}

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request, { requireOrigin: true })) {
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
