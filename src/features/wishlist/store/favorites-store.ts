/**
 * Favorites store — the display source of truth for wishlist hearts.
 *
 * An immutable Set<string> of product ids. Every mutation creates a NEW Set
 * instance (never mutated in place) so React Compiler / selector consumers get
 * a stable, change-detectable reference (Lot 4 reactivity depends on this).
 *
 * Public read API is selectors returning PRIMITIVES only (has → boolean,
 * size → number, ids → string[]); the Set is never exposed through a public
 * selector.
 *
 * Owner: "guest" for favorites picked while signed out, "account" once the
 * signed-in list replaced them (replaceAll). Only a guest Set is ever written
 * to localStorage, and only a guest Set is merged into an account at login:
 * on a shared device, an account's favorites never reach the next account
 * (audit P1-11).
 *
 * Guest persistence: localStorage key `sugu_favorites_guest_v1`, Set serialized
 * as an ids array, FIFO eviction at cap 200 (matching the backend). What is
 * read back is validated (ids only, capped); version 1 data, which could hold
 * an account's ids, is dropped. Hydration is manual (skipHydration) —
 * WishlistProvider triggers rehydrate().
 *
 * Note: the state property is named `favoriteSet` (not `set`) to avoid colliding
 * with Zustand's `set` updater within the store scope.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const CAP = 200;
const STORAGE_KEY = "sugu_favorites_guest_v1";
const STORAGE_VERSION = 2;
const PRODUCT_ID = /^[A-Za-z0-9_-]{1,64}$/;

export type FavoritesOwner = "guest" | "account";

type State = {
  favoriteSet: ReadonlySet<string>;
  owner: FavoritesOwner;
};

type Actions = {
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  replaceAll: (ids: string[]) => void;
  clearGuest: () => void;
  // Selectors — read-only, return primitives.
  has: (id: string) => boolean;
  size: () => number;
  ids: () => string[];
};

type PersistedFavorites = { ids: string[] };

/** Product ids only, without duplicates, the most recent CAP kept. */
function validIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = Array.from(
    new Set(value.filter((id): id is string => typeof id === "string" && PRODUCT_ID.test(id))),
  );
  return ids.slice(-CAP);
}

export const useFavoritesStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      favoriteSet: new Set<string>(),
      owner: "guest",

      add: (id) => {
        const current = get().favoriteSet;
        if (current.has(id)) return; // idempotent no-op (no repositioning)
        const next = new Set(current);
        if (next.size >= CAP) {
          // FIFO eviction: Set preserves insertion order, so the first value
          // is the oldest entry.
          const oldest = next.values().next().value;
          if (oldest !== undefined) next.delete(oldest);
        }
        next.add(id);
        set({ favoriteSet: next });
      },

      remove: (id) => {
        const current = get().favoriteSet;
        if (!current.has(id)) return; // idempotent no-op
        const next = new Set(current);
        next.delete(id);
        set({ favoriteSet: next });
      },

      toggle: (id) => {
        if (get().favoriteSet.has(id)) get().remove(id);
        else get().add(id);
      },

      replaceAll: (ids) => {
        // Authoritative replace from the signed-in list (bootstrap).
        set({ favoriteSet: new Set(ids), owner: "account" });
      },

      clearGuest: () => {
        set({ favoriteSet: new Set<string>(), owner: "guest" });
      },

      has: (id) => get().favoriteSet.has(id),
      size: () => get().favoriteSet.size,
      ids: () => Array.from(get().favoriteSet),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // manual rehydrate from WishlistProvider (Lot 3)
      // An account's list never touches the device's storage.
      partialize: (state): PersistedFavorites => ({
        ids: state.owner === "guest" ? Array.from(state.favoriteSet) : [],
      }),
      // Version 1 did not tell a guest Set from an account's: drop it.
      migrate: (): PersistedFavorites => ({ ids: [] }),
      merge: (persisted, current) => ({
        ...current,
        favoriteSet: new Set(validIds((persisted as Partial<PersistedFavorites> | undefined)?.ids)),
        owner: "guest",
      }),
    },
  ),
);
