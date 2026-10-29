import { NextResponse } from "next/server";

/**
 * Liveness probe for the container HEALTHCHECK: the Node server answers. It
 * calls nothing else, so a backend outage does not get this container killed.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
}
