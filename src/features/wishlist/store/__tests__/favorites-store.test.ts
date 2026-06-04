// @vitest-environment jsdom
/**
 * Favorites store — Lot 2. localStorage requires jsdom; no network (no MSW).
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useFavoritesStore } from "../favorites-store";

const STORAGE_KEY = "sugu_favorites_guest_v1";

function reset() {
  localStorage.clear();
  useFavoritesStore.setState({ favoriteSet: new Set<string>() });
}

beforeEach(reset);

describe("favorites store — mutations & selectors", () => {
  it("starts with an empty Set", () => {
    expect(useFavoritesStore.getState().size()).toBe(0);
  });

  it("adds an id and exposes it via has() returning boolean true", () => {
    useFavoritesStore.getState().add("a");
    const result = useFavoritesStore.getState().has("a");
    expect(result).toBe(true);
    expect(typeof result).toBe("boolean");
  });

  it("returns false from has() for an unknown id", () => {
    expect(useFavoritesStore.getState().has("nope")).toBe(false);
  });

  it("removes an id and has() returns false", () => {
    const s = useFavoritesStore.getState();
    s.add("a");
    s.remove("a");
    expect(useFavoritesStore.getState().has("a")).toBe(false);
  });

  it("toggles membership idempotently", () => {
    const s = useFavoritesStore.getState();
    s.toggle("a");
    expect(useFavoritesStore.getState().has("a")).toBe(true);
    s.toggle("a");
    expect(useFavoritesStore.getState().has("a")).toBe(false);
  });

  it("is a no-op when adding an already-present id", () => {
    const s = useFavoritesStore.getState();
    s.add("a");
    const before = useFavoritesStore.getState().favoriteSet;
    s.add("a");
    const after = useFavoritesStore.getState().favoriteSet;
    expect(after).toBe(before); // same reference — no state change
    expect(useFavoritesStore.getState().size()).toBe(1);
  });

  it("is a no-op when removing an absent id", () => {
    const before = useFavoritesStore.getState().favoriteSet;
    useFavoritesStore.getState().remove("ghost");
    const after = useFavoritesStore.getState().favoriteSet;
    expect(after).toBe(before);
  });

  it("returns a new Set reference on every mutation", () => {
    const r0 = useFavoritesStore.getState().favoriteSet;
    useFavoritesStore.getState().add("a");
    const r1 = useFavoritesStore.getState().favoriteSet;
    useFavoritesStore.getState().add("b");
    const r2 = useFavoritesStore.getState().favoriteSet;
    useFavoritesStore.getState().remove("a");
    const r3 = useFavoritesStore.getState().favoriteSet;
    expect(r1).not.toBe(r0);
    expect(r2).not.toBe(r1);
    expect(r3).not.toBe(r2);
  });

  it("returns boolean from has() (not the Set itself)", () => {
    useFavoritesStore.getState().add("a");
    expect(useFavoritesStore.getState().has("a")).toBe(true);
    expect(useFavoritesStore.getState().has("a")).not.toBeInstanceOf(Set);
  });

  it("returns number from size() selector", () => {
    useFavoritesStore.getState().add("a");
    useFavoritesStore.getState().add("b");
    expect(useFavoritesStore.getState().size()).toBe(2);
  });

  it("returns string[] from ids() selector", () => {
    useFavoritesStore.getState().add("a");
    useFavoritesStore.getState().add("b");
    const ids = useFavoritesStore.getState().ids();
    expect(Array.isArray(ids)).toBe(true);
    expect(ids).toEqual(["a", "b"]);
  });

  it("replaces the full Set on replaceAll(ids)", () => {
    const s = useFavoritesStore.getState();
    s.add("a");
    s.replaceAll(["x", "y", "z"]);
    expect(useFavoritesStore.getState().has("a")).toBe(false);
    expect(useFavoritesStore.getState().size()).toBe(3);
    expect(useFavoritesStore.getState().has("y")).toBe(true);
  });

  it("clears the Set on clearGuest()", () => {
    const s = useFavoritesStore.getState();
    s.add("a");
    s.clearGuest();
    expect(useFavoritesStore.getState().size()).toBe(0);
  });
});

describe("favorites store — cap 200 FIFO", () => {
  it("caps at 200 and evicts oldest entry FIFO when adding past cap", () => {
    const s = useFavoritesStore.getState();
    for (let i = 0; i < 200; i++) s.add(`id-${i}`);
    expect(useFavoritesStore.getState().size()).toBe(200);

    s.add("id-200");
    const state = useFavoritesStore.getState();
    expect(state.size()).toBe(200);
    expect(state.has("id-0")).toBe(false); // oldest evicted
    expect(state.has("id-1")).toBe(true);
    expect(state.has("id-200")).toBe(true);
  });
});

describe("favorites store — persistence", () => {
  it("persists guest set as ids array under key sugu_favorites_guest_v1", () => {
    useFavoritesStore.getState().add("a");
    useFavoritesStore.getState().add("b");
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as { state: { ids: string[] }; version: number };
    expect(parsed.version).toBe(1);
    expect(parsed.state.ids).toEqual(["a", "b"]);
  });

  it("does not auto-hydrate on init (skipHydration true)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { ids: ["x", "y"] }, version: 1 }),
    );
    // Store was created at import with skipHydration; no auto-read happened.
    expect(useFavoritesStore.getState().size()).toBe(0);
  });

  it("rehydrates the Set when persist.rehydrate() is called", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { ids: ["x", "y"] }, version: 1 }),
    );
    await useFavoritesStore.persist.rehydrate();
    const state = useFavoritesStore.getState();
    expect(state.size()).toBe(2);
    expect(state.has("x")).toBe(true);
    expect(state.has("y")).toBe(true);
  });
});
