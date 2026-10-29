/**
 * BFF — l'adresse du visiteur (audit P1-3).
 *
 * Laravel tient des limites par adresse (connexions, OTP, routes publiques).
 * Le relais appelle Laravel depuis le serveur : il lui transmet l'adresse du
 * visiteur, lue dans `x-forwarded-for` en partant de la droite comme Laravel
 * le ferait, et signée (X-Sugu-Client-IP, -Ts, -Sig sous SUGU_EDGE_SECRET).
 * La chaîne `x-forwarded-for` elle-même n'est jamais relayée : un visiteur peut
 * y écrire l'adresse de son choix.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { GET, POST } from "@/app/api/backend/[...path]/route";
import { API_BASE_URL } from "@/lib/api/config";
import { signClientIp } from "@/lib/server/client-ip";

setupMswServer();
afterEach(() => vi.unstubAllEnvs());

const SECRET = "0123456789abcdef0123456789abcdef";
const APP = "https://sugu.test";
const LOGIN_URL = new URL("/api/v1/web-auth/login", API_BASE_URL).toString();
const ORDERS_URL = new URL("/api/v1/orders", API_BASE_URL).toString();

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path: ["api", "v1", ...path] }) });

function captureOrders(): Headers[] {
  const seen: Headers[] = [];
  server.use(
    http.get(ORDERS_URL, ({ request }) => {
      seen.push(request.headers);
      return HttpResponse.json({ success: true, data: {} });
    }),
  );
  return seen;
}

describe("BFF client address", () => {
  it("signs the visitor's address on a sign-in", async () => {
    vi.stubEnv("SUGU_EDGE_SECRET", SECRET);
    let seen: Headers | null = null;
    server.use(
      http.post(LOGIN_URL, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({ success: false, message: "Identifiants invalides." }, { status: 401 });
      }),
    );

    await POST(
      new NextRequest(`${APP}/`, {
        method: "POST",
        headers: {
          origin: APP,
          "content-type": "application/json",
          "x-forwarded-for": "198.18.0.9, 41.203.64.10",
        },
        body: JSON.stringify({ login_field: "a@b.test", password: "x" }),
      }),
      ctx("web-auth", "login"),
    );

    const ip = seen!.get("x-sugu-client-ip");
    const ts = Number(seen!.get("x-sugu-client-ip-ts"));
    expect(ip).toBe("41.203.64.10");
    expect(Math.abs(ts - Date.now() / 1000)).toBeLessThan(5);
    expect(seen!.get("x-sugu-client-ip-sig")).toBe(await signClientIp("41.203.64.10", ts, SECRET));
  });

  it("never relays the forwarded chain the visitor can write", async () => {
    vi.stubEnv("SUGU_EDGE_SECRET", SECRET);
    const seen = captureOrders();

    await GET(new NextRequest(`${APP}/`, { headers: { "x-forwarded-for": "198.18.0.9, 41.203.64.10" } }), ctx("orders"));

    expect(seen[0].get("x-forwarded-for")).toBeNull();
    expect(seen[0].get("x-sugu-client-ip")).toBe("41.203.64.10");
  });

  it("drops the address headers a visitor sends, and signs nothing without a secret", async () => {
    const seen = captureOrders();

    await GET(
      new NextRequest(`${APP}/`, {
        headers: {
          "x-forwarded-for": "41.203.64.10",
          "x-sugu-client-ip": "198.18.0.9",
          "x-sugu-client-ip-ts": "1",
          "x-sugu-client-ip-sig": "00",
        },
      }),
      ctx("orders"),
    );

    for (const name of ["x-sugu-client-ip", "x-sugu-client-ip-ts", "x-sugu-client-ip-sig", "x-forwarded-for"]) {
      expect(seen[0].get(name), name).toBeNull();
    }
  });

  it("does not relay the other headers a visitor could name an address with", async () => {
    const seen = captureOrders();

    await GET(
      new NextRequest(`${APP}/`, {
        headers: { "x-real-ip": "198.18.0.9", "cf-connecting-ip": "198.18.0.9", forwarded: "for=198.18.0.9", "true-client-ip": "198.18.0.9" },
      }),
      ctx("orders"),
    );

    for (const name of ["x-real-ip", "cf-connecting-ip", "forwarded", "true-client-ip"]) {
      expect(seen[0].get(name), name).toBeNull();
    }
  });
});
