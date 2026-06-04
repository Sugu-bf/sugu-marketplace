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
 * Guest persistence: localStorage key `sugu_favorites_guest_v1`, Set serialized
 * as an ids array, FIFO eviction at cap 200 (matching the backend). Hydration
 * is manual (skipHydration) — WishlistProvider triggers rehydrate() at Lot 3.
 *
 * Note: the state property is named `favoriteSet` (not `set`) to avoid colliding
 * with Zustand's `set` updater within the store scope.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const CAP = 200;
const STORAGE_KEY = "sugu_favorites_guest_v1";

type State = {
  favoriteSet: ReadonlySet<string>;
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

export const useFavoritesStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      favoriteSet: new Set<string>(),

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
        // Authoritative replace, used at bootstrap (Lot 3).
        set({ favoriteSet: new Set(ids) });
      },

      clearGuest: () => {
        set({ favoriteSet: new Set<string>() });
      },

      has: (id) => get().favoriteSet.has(id),
      size: () => get().favoriteSet.size,
      ids: () => Array.from(get().favoriteSet),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // manual rehydrate from WishlistProvider (Lot 3)
      partialize: (state): PersistedFavorites => ({ ids: Array.from(state.favoriteSet) }),
      merge: (persisted, current) => {
        const ids = (persisted as PersistedFavorites | undefined)?.ids ?? [];
        return { ...current, favoriteSet: new Set(ids) };
      },
    },
  ),
);
