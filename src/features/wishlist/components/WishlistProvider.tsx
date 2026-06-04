"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFavoritesStore } from "../store/favorites-store";
import { useFavoritesBootstrap } from "../queries/use-favorites-bootstrap";
import { useMergeFavoritesOnLogin } from "../hooks/use-merge-favorites-on-login";

/**
 * Wires the favorites data layer at the app root (mounted at Lot 4). Three mount
 * concerns, no React Context — the store is consumed directly via
 * useFavoritesStore:
 *   1. Rehydrate the guest Set from localStorage (store has skipHydration).
 *   2. Reconcile guest → user favorites at login (idempotent hook).
 *   3. Replicate the bootstrap query's ids into the store (one-way), guarded
 *      against redundant replaces by an etag/length:updatedAt signature.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  // 1. Rehydrate once (StrictMode-safe via ref).
  const rehydratedRef = useRef(false);
  useEffect(() => {
    if (rehydratedRef.current) return;
    rehydratedRef.current = true;
    void useFavoritesStore.persist.rehydrate();
  }, []);

  // 2. Merge guest favorites at login.
  useMergeFavoritesOnLogin();

  // 3. Replicate query data → store (one-way), skipping unchanged signatures.
  const { data } = useFavoritesBootstrap();
  const lastSigRef = useRef<string | null>(null);
  useEffect(() => {
    if (!data) return;
    const sig = data.etag ?? `${data.ids.length}:${data.updatedAt}`;
    if (lastSigRef.current === sig) return;
    lastSigRef.current = sig;
    useFavoritesStore.getState().replaceAll(data.ids);
  }, [data]);

  return <>{children}</>;
}
