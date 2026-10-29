import { describe, it, expect } from "vitest";
import { readCappedBody } from "@/lib/server/read-capped-body";

function streamed(chunks: string[]): Request {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Request("https://sugu.test/", { method: "POST", body, duplex: "half" } as RequestInit);
}

const text = (body: Uint8Array | null) => (body ? new TextDecoder().decode(body) : null);

describe("readCappedBody", () => {
  it("returns the whole body when it fits", async () => {
    const request = new Request("https://sugu.test/", { method: "POST", body: "hello" });
    expect(text(await readCappedBody(request, 5))).toBe("hello");
  });

  it("returns an empty body for a request without one", async () => {
    expect(await readCappedBody(new Request("https://sugu.test/"), 5)).toEqual(new Uint8Array(0));
  });

  it("refuses a declared length above the limit without reading", async () => {
    const request = new Request("https://sugu.test/", {
      method: "POST",
      body: "x",
      headers: { "content-length": "6" },
    });
    expect(await readCappedBody(request, 5)).toBeNull();
    expect(request.bodyUsed).toBe(false);
  });

  it("refuses a malformed declared length", async () => {
    const request = new Request("https://sugu.test/", {
      method: "POST",
      body: "x",
      headers: { "content-length": "1e3" },
    });
    expect(await readCappedBody(request, 5000)).toBeNull();
  });

  it("cuts a streamed body off as soon as it passes the limit", async () => {
    expect(await readCappedBody(streamed(["abc", "def"]), 5)).toBeNull();
    expect(text(await readCappedBody(streamed(["ab", "cde"]), 5))).toBe("abcde");
  });
});
