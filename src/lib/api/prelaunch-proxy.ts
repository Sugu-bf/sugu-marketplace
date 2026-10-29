import { NextResponse, type NextRequest } from "next/server";
import { API_BASE_URL, API_TIMEOUT_MS } from "./config";
import { isSameOriginRequest } from "./same-origin";

/** Largest form accepted from the pre-launch pages, in bytes. */
const MAX_BODY_BYTES = 8 * 1024;

/**
 * Forward a pre-launch form (waitlist, seller pre-registration) to Laravel.
 *
 * Only from this site, as JSON: a cross-site `text/plain` form post used to
 * reach these routes (no CORS preflight), so any page could sign visitors
 * up, and every such call counted against the one rate limit shared by the
 * Next server's IP.
 */
export async function forwardPrelaunchForm(request: NextRequest, path: string): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, message: "Origine non autorisée." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json({ success: false, message: "Format de requête non pris en charge." }, { status: 415 });
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return NextResponse.json({ success: false, message: "Requête trop volumineuse." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ success: false, message: "Requête invalide." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false, message: "Requête invalide." }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/public/prelaunch/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    const data = res.headers.get("content-type")?.includes("application/json")
      ? await res.json()
      : { message: "Erreur serveur inattendue." };

    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, message: "Service indisponible." }, { status: 502 });
  }
}
