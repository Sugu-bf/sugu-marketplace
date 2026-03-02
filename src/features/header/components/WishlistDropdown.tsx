"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/constants";
import { fetchWishlistPreview, type WishlistPreviewData } from "../api/header.api";
import { WishlistDropdownSkeleton } from "./HeaderSkeletons";

/**
 * WishlistDropdown — hover/click popover showing wishlist preview.
 *
 * Lazy-fetches wishlist data on first open.
 * Displays up to 5 items with thumbnail, name, and price.
 */
export default function WishlistDropdown() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<WishlistPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const result = await fetchWishlistPreview();
      setData(result);
    } catch {
      // Silently fail — empty state shown
    } finally {
      setFetched(true);
      setLoading(false);
    }
  }, [fetched]);

  const handleEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
    loadData();
  }, [loadData]);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Cleanup abort on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const items = data?.items ?? [];
  const count = data?.count ?? 0;
  const isEmpty = fetched && items.length === 0;

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Trigger */}
      <Link
        href="/account"
        className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white"
        aria-label={`Liste de souhaits${count > 0 ? ` (${count} articles)` : ""}`}
        id="header-wishlist-trigger"
      >
        <Heart size={20} />
      </Link>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white shadow-xl border border-gray-100 py-2 z-50 hidden md:block animate-fade-slide-down">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">Liste de souhaits</p>
            <span className="text-xs text-muted-foreground">
              {count} article{count !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Content */}
          {loading && !fetched ? (
            <WishlistDropdownSkeleton />
          ) : isEmpty ? (
            <div className="px-4 py-6 text-center">
              <Heart size={28} className="mx-auto mb-2 text-border" />
              <p className="text-sm text-muted-foreground mb-3">
                Votre liste de souhaits est vide
              </p>
              <Link
                href="/search"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                Découvrir des produits
              </Link>
            </div>
          ) : (
            <>
              {items.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={item.product_slug ? `/product/${item.product_slug}` : "#"}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors duration-150"
                  onClick={() => setOpen(false)}
                >
                  <div className="relative h-10 w-10 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain p-1"
                        sizes="40px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-border">
                        <Heart size={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium truncate">
                      {item.name}
                    </p>
                    <p className="text-xs font-bold text-primary">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </Link>
              ))}

              {/* CTA */}
              <div className="px-4 pt-2 pb-1 border-t border-border mt-1">
                <Link
                  href="/account"
                  className={cn(
                    "block w-full rounded-xl border-2 border-primary py-2 text-center text-sm font-bold text-primary",
                    "transition-all duration-200 hover:bg-primary hover:text-white active:scale-95"
                  )}
                  onClick={() => setOpen(false)}
                >
                  Voir tout
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
