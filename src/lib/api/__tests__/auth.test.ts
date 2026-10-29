/**
 * The auth state of a request (audit P1-8, F4): an unknown session is never
 * mistaken for a signed-out one, and no reply is ever mistaken for a user.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAuthState, getAuthUser } from "@/lib/api/auth";

const mockFetch = vi.fn();

function reply(body: unknown, status = 200) {
  mockFetch.mockImplementation(async () => Response.json(body, { status }));
}

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => vi.unstubAllGlobals());

const USER = { id: "01jkqz3m5baxnp9c7hd2fewyu1", name: "Awa", email: null, created_at: "2026-01-01" };

describe("getAuthState", () => {
  it("is authenticated with the user of a successful envelope", async () => {
    reply({ success: true, data: { user: USER } });
    expect(await getAuthState()).toEqual({ status: "authenticated", user: USER });
  });

  it("is unauthenticated on a 401 or a 404", async () => {
    reply({ message: "Unauthenticated." }, 401);
    expect(await getAuthState()).toEqual({ status: "unauthenticated" });

    reply({}, 404);
    expect(await getAuthState()).toEqual({ status: "unauthenticated" });
  });

  it("is unavailable when the backend fails", async () => {
    reply({ message: "Server Error" }, 503);
    const state = await getAuthState();
    expect(state.status).toBe("unavailable");
    expect(state.status === "unavailable" && state.error.status).toBe(503);
  });

  it.each([
    ["a failed envelope", { success: false, message: "Erreur" }],
    ["a bare object", { name: "not a user" }],
    ["a user without id", { success: true, data: { user: { name: "x" } } }],
  ])("never takes %s for a user", async (_label, body) => {
    reply(body);
    const state = await getAuthState();
    expect(state.status).toBe("unavailable");
    expect(state.status === "unavailable" && state.error.code).toBe("INVALID_SCHEMA");
  });
});

describe("getAuthUser", () => {
  it("returns the user, or null when signed out", async () => {
    reply({ success: true, data: { user: USER } });
    expect(await getAuthUser()).toEqual(USER);

    reply({}, 401);
    expect(await getAuthUser()).toBeNull();
  });

  it("throws when the backend cannot tell", async () => {
    reply({ success: false });
    await expect(getAuthUser()).rejects.toMatchObject({ code: "INVALID_SCHEMA" });
  });
});
