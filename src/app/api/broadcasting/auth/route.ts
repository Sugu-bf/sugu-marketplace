import { NextRequest, NextResponse } from "next/server";
import { API_BASE_URL } from "@/lib/api/config";
import { AUTH_TOKEN_COOKIE, isValidSanctumTokenFormat } from "@/lib/api/session";
import { clientIpHeaders } from "@/lib/server/client-ip";
import { readCappedBody } from "@/lib/server/read-capped-body";
import { isSameOriginRequest } from "@/lib/server/same-origin";

/** Laravel has this long to authorize a channel. */
const UPSTREAM_TIMEOUT_MS = 10_000;

/** A socket id and a channel name: a few hundred bytes. */
const MAX_BODY_BYTES = 4 * 1024;

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

async function forwardHeaders(request: NextRequest, token: string): Promise<Headers> {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  for (const name of ["accept-language", "user-agent", "x-request-id"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  for (const [name, value] of Object.entries(await clientIpHeaders(request.headers))) {
    headers.set(name, value);
  }

  return headers;
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request, { requireOrigin: true })) {
    return NextResponse.json({ message: "Forbidden origin." }, { status: 403 });
  }

  const token = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  if (!isValidSanctumTokenFormat(token)) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const body = await readCappedBody(request, MAX_BODY_BYTES);
  if (!body) {
    return NextResponse.json({ message: "Payload too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  }

  if (!isValidBroadcastPayload(payload)) {
    return NextResponse.json({ message: "Invalid channel authorization payload." }, { status: 422 });
  }

  let upstream: Response;
  let text: string;
  try {
    upstream = await fetch(new URL("/api/broadcasting/auth", API_BASE_URL), {
      method: "POST",
      headers: await forwardHeaders(request, token),
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)]),
    });
    text = await upstream.text();
  } catch (error) {
    console.error(`[broadcasting-auth] failed: ${error instanceof Error ? error.name : "UnknownError"}`);
    return NextResponse.json(
      { message: "Channel authorization unavailable." },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }

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
