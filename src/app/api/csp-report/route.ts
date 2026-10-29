import { NextRequest, NextResponse } from "next/server";
import { readCappedBody } from "@/lib/server/read-capped-body";

/**
 * Sink for the violation reports of the Content-Security-Policy (see
 * @/lib/security/security-headers). Each report is logged as one bounded line,
 * so the policy can be tightened, then enforced, on what browsers really saw.
 *
 * Anyone can post here: the body is size-capped, every logged field is cut
 * short and stripped of control characters, and nothing is stored.
 */

const MAX_BODY_BYTES = 16 * 1024;
const MAX_FIELD_LENGTH = 300;

function field(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  return String(value).replace(/[\x00-\x1F\x7F]/g, " ").slice(0, MAX_FIELD_LENGTH);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Both report formats: `report-uri` ({ "csp-report": … }) and Reporting API ([{ body: … }]). */
function violations(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload
      .map((entry) => record(record(entry)?.body))
      .filter((body): body is Record<string, unknown> => body !== null)
      .slice(0, 10);
  }
  const legacy = record(record(payload)?.["csp-report"]);
  return legacy ? [legacy] : [];
}

function summary(violation: Record<string, unknown>) {
  return {
    directive: field(violation["effective-directive"] ?? violation.effectiveDirective ?? violation["violated-directive"]),
    blocked: field(violation["blocked-uri"] ?? violation.blockedURL),
    page: field(violation["document-uri"] ?? violation.documentURL),
    source: field(violation["source-file"] ?? violation.sourceFile),
    line: field(violation["line-number"] ?? violation.lineNumber),
    disposition: field(violation.disposition),
  };
}

export async function POST(request: NextRequest) {
  const body = await readCappedBody(request, MAX_BODY_BYTES);
  if (!body) {
    return new NextResponse(null, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  for (const violation of violations(payload)) {
    console.warn("[csp-report]", JSON.stringify(summary(violation)));
  }

  return new NextResponse(null, { status: 204 });
}
