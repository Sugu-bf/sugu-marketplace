import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/csp-report/route";

function report(body: string, type = "application/csp-report"): NextRequest {
  return new NextRequest("https://sugu.test/api/csp-report", {
    method: "POST",
    headers: { "content-type": type },
    body,
  });
}

function logged(warn: ReturnType<typeof vi.spyOn>, call = 0): Record<string, string> {
  return JSON.parse(warn.mock.calls[call][1] as string);
}

afterEach(() => vi.restoreAllMocks());

describe("POST /api/csp-report", () => {
  it("logs one bounded line per violation of a report-uri report", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const response = await POST(
      report(
        JSON.stringify({
          "csp-report": {
            "document-uri": "https://sugu.pro/product/x",
            "effective-directive": "script-src-elem",
            "blocked-uri": `https://evil.test/${"a".repeat(1000)}\n`,
          },
        }),
      ),
    );

    expect(response.status).toBe(204);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(logged(warn).directive).toBe("script-src-elem");
    expect(logged(warn).page).toBe("https://sugu.pro/product/x");
    expect(logged(warn).blocked).toHaveLength(300);
    expect(logged(warn).blocked).not.toContain("\n");
  });

  it("reads the Reporting API format too", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const response = await POST(
      report(
        JSON.stringify([
          {
            type: "csp-violation",
            body: { effectiveDirective: "img-src", blockedURL: "https://x.test/a.png" },
          },
        ]),
        "application/reports+json",
      ),
    );

    expect(response.status).toBe(204);
    expect(logged(warn).blocked).toBe("https://x.test/a.png");
  });

  it("refuses an oversized body and ignores what is not JSON", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect((await POST(report("x".repeat(17 * 1024)))).status).toBe(413);
    expect((await POST(report("not json"))).status).toBe(400);
    expect(warn).not.toHaveBeenCalled();
  });
});
