/**
 * BFF — a message attachment read through the relay.
 *
 * Attachments are no longer public: the browser reads them at
 * `/api/backend/api/v1/me/conversations/{c}/messages/{m}/attachments/{media}`,
 * the relay adds the session and passes the file on. It must arrive byte for
 * byte, with what lets the browser show or download it safely (type,
 * disposition, nosniff, sandbox), never kept by a cache, and with a length
 * that counts the bytes actually sent.
 */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { GET } from "@/app/api/backend/[...path]/route";
import { API_BASE_URL } from "@/lib/api/config";

setupMswServer();

const CONVERSATION = "01jkqz3m5baxnp9c7hd2fewyr4";
const MESSAGE = "01jkqz3m5baxnp9c7hd2fewys1";
const SEGMENTS = ["me", "conversations", CONVERSATION, "messages", MESSAGE, "attachments", "42"];
const UPSTREAM_URL = new URL(`/api/v1/${SEGMENTS.join("/")}`, API_BASE_URL).toString();
const TOKEN = `12|${"a".repeat(40)}`;

// Not valid UTF-8 on purpose: a body read as text would come out changed.
const BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff, 0xfe, 0x80, 0xc3]);

const ctx = () => ({ params: Promise.resolve({ path: ["api", "v1", ...SEGMENTS] }) });

function imageRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/", {
    headers: { cookie: `auth_token=${TOKEN}`, "sec-fetch-site": "same-origin", accept: "image/webp,*/*" },
  });
}

describe("BFF attachment relay", () => {
  it("passes the file on byte for byte, with the session of the reader", async () => {
    let authorization: string | null = null;
    server.use(
      http.get(UPSTREAM_URL, ({ request }) => {
        authorization = request.headers.get("authorization");
        return new HttpResponse(BYTES, { status: 200, headers: { "content-type": "image/png" } });
      }),
    );

    const res = await GET(imageRequest(), ctx());

    expect(authorization).toBe(`Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(BYTES);
  });

  it("keeps what lets the browser show or download it safely, and nothing is cached", async () => {
    server.use(
      http.get(UPSTREAM_URL, () =>
        new HttpResponse(BYTES, {
          status: 200,
          headers: {
            "content-type": "application/pdf",
            "content-disposition": 'inline; filename="facture.pdf"',
            "x-content-type-options": "nosniff",
            "content-security-policy": "default-src 'none'; sandbox",
            "cache-control": "private, no-store",
          },
        }),
      ),
    );

    const res = await GET(imageRequest(), ctx());

    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe('inline; filename="facture.pdf"');
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toBe("default-src 'none'; sandbox");
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("gives the length of the bytes it sends, not the one Laravel announced", async () => {
    server.use(
      http.get(UPSTREAM_URL, () =>
        // As when the body came compressed and fetch decoded it.
        new HttpResponse(BYTES, { status: 200, headers: { "content-type": "image/png", "content-length": "4" } }),
      ),
    );

    const res = await GET(imageRequest(), ctx());

    expect(res.headers.get("content-length")).toBe(String(BYTES.byteLength));
    expect((await res.arrayBuffer()).byteLength).toBe(BYTES.byteLength);
  });

  it("still relays none of the other headers Laravel sends", async () => {
    server.use(
      http.get(UPSTREAM_URL, () =>
        new HttpResponse(BYTES, {
          status: 200,
          headers: {
            "content-type": "image/png",
            "set-cookie": "laravel_session=abc; Path=/",
            server: "nginx",
            "x-powered-by": "PHP/8.3",
            "access-control-allow-origin": "*",
          },
        }),
      ),
    );

    const res = await GET(imageRequest(), ctx());

    for (const name of ["set-cookie", "server", "x-powered-by", "access-control-allow-origin"]) {
      expect(res.headers.get(name), name).toBeNull();
    }
  });

  it("refuses a file asked for from another site", async () => {
    let reached = false;
    server.use(
      http.get(UPSTREAM_URL, () => {
        reached = true;
        return new HttpResponse(BYTES, { status: 200 });
      }),
    );

    const res = await GET(
      new NextRequest("http://localhost:3000/", {
        headers: { cookie: `auth_token=${TOKEN}`, "sec-fetch-site": "cross-site" },
      }),
      ctx(),
    );

    expect(res.status).toBe(403);
    expect(reached).toBe(false);
  });

  it("sends no length with an empty answer", async () => {
    server.use(
      http.get(UPSTREAM_URL, () => new HttpResponse(null, { status: 304, headers: { etag: '"a1"', "content-length": "13" } })),
    );

    const res = await GET(imageRequest(), ctx());

    expect(res.status).toBe(304);
    expect(res.headers.get("content-length")).toBeNull();
  });
});
