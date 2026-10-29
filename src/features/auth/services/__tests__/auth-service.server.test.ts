/**
 * On the server, the session hint is never read from or written to a
 * localStorage global (Node 22+ has one of its own, shared by every request):
 * browser detection relies on `window` (audit P1-13).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { getTokenExpiry, setTokenExpiry } from "@/features/auth/services/auth-service";

afterEach(() => vi.unstubAllGlobals());

describe("auth-service on the server", () => {
  it("ignores a server-side localStorage", () => {
    const serverStorage = {
      getItem: vi.fn(() => "2030-01-01T00:00:00Z"),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    vi.stubGlobal("localStorage", serverStorage);

    setTokenExpiry("2031-01-01T00:00:00Z");

    expect(getTokenExpiry()).toBeNull();
    expect(serverStorage.getItem).not.toHaveBeenCalled();
    expect(serverStorage.setItem).not.toHaveBeenCalled();
  });
});
