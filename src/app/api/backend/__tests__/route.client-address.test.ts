/**
 * BFF — l'adresse du visiteur (V4.2).
 *
 * Laravel tient des limites par adresse (connexions, routes publiques). Le
 * relais appelle Laravel depuis le serveur : s'il ne transmet rien, tous les
 * visiteurs arrivent de la même adresse. Il transmet la chaîne
 * `x-forwarded-for` écrite par le proxy placé devant la marketplace, telle
 * quelle. Laravel ne la lit que s'il fait confiance au saut d'où elle vient
 * (TRUSTED_PROXIES), et y prend l'entrée ajoutée par ses proxys de confiance,
 * pas celle qu'un visiteur aurait écrite lui-même à gauche.
 */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { setupMswServer } from "@/test/msw/setup";
import { GET, POST } from "@/app/api/backend/[...path]/route";
import { API_BASE_URL } from "@/lib/api/config";

setupMswServer();

const LOGIN_URL = new URL("/api/v1/web-auth/login", API_BASE_URL).toString();
const ORDERS_URL = new URL("/api/v1/orders", API_BASE_URL).toString();

const ctx = (...path: string[]) => ({ params: Promise.resolve({ path: ["api", "v1", ...path] }) });

describe("BFF client address", () => {
  it("passes the forwarded chain on with a sign-in, untouched", async () => {
    let seen: Headers | null = null;
    server.use(
      http.post(LOGIN_URL, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({ success: false, message: "Identifiants invalides." }, { status: 401 });
      }),
    );

    await POST(
      new NextRequest("http://localhost:3000/", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "content-type": "application/json",
          "x-forwarded-for": "198.18.0.9, 41.203.64.10",
        },
        body: JSON.stringify({ login_field: "a@b.test", password: "x" }),
      }),
      ctx("web-auth", "login"),
    );

    expect(seen!.get("x-forwarded-for")).toBe("198.18.0.9, 41.203.64.10");
  });

  it("passes it on with a read too, and invents none when the proxy wrote none", async () => {
    const seen: (string | null)[] = [];
    server.use(
      http.get(ORDERS_URL, ({ request }) => {
        seen.push(request.headers.get("x-forwarded-for"));
        return HttpResponse.json({ success: true, data: {} });
      }),
    );

    await GET(new NextRequest("http://localhost:3000/", { headers: { "x-forwarded-for": "41.203.64.10" } }), ctx("orders"));
    await GET(new NextRequest("http://localhost:3000/"), ctx("orders"));

    expect(seen).toEqual(["41.203.64.10", null]);
  });

  it("does not relay the other headers a visitor could name an address with", async () => {
    let seen: Headers | null = null;
    server.use(
      http.get(ORDERS_URL, ({ request }) => {
        seen = request.headers;
        return HttpResponse.json({ success: true, data: {} });
      }),
    );

    await GET(
      new NextRequest("http://localhost:3000/", {
        headers: { "x-real-ip": "198.18.0.9", "cf-connecting-ip": "198.18.0.9", forwarded: "for=198.18.0.9", "true-client-ip": "198.18.0.9" },
      }),
      ctx("orders"),
    );

    for (const name of ["x-real-ip", "cf-connecting-ip", "forwarded", "true-client-ip"]) {
      expect(seen!.get(name), name).toBeNull();
    }
  });
});
