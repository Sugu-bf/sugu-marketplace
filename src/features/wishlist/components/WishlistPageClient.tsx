"use client";

/**
 * WishlistPageClient — Lot 5.
 *
 * Hydrated Client Component consumed by the Server Component shell
 * (src/app/(main)/account/wishlist/page.tsx). Imported DIRECTLY — NOT via the
 * wishlist barrel — to avoid pulling client hooks into the RSC module graph
 * (cf. memory wishlist-barrel-rsc-boundary).
 *
 * States: unauthenticated (defensive) → loading → error → empty → list.
 * Price mapping: WishlistPageItem.price is in centimes (minor units). Divided
 * by 100 before passing to ProductCard (memory prices-minor-units-centimes).
 */
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui";
import { ProductCard } from "@/components/ui/product-card";
import { hasAuthSession } from "@/features/auth/services/auth-service";
import { useWishlistPage } from "@/features/wishlist/queries/use-wishlist-page";
import type { WishlistPageResponse } from "@/features/wishlist/api/favorites.schemas";

type WishlistPageItem =
  WishlistPageResponse["wishlist"]["items"][number];

/**
 * Map a backend WishlistPageItem → ProductListItem shape for <ProductCard>.
 *
 * Decisions (pré-vol F — approved by user):
 *  - slug: ""     → ProductCard renders href="#" (no navigation to PDP from
 *                    wishlist in this MVP). Backlog when backend adds slug field.
 *  - thumbnail:   → image_url (same image, different field name).
 *  - rating, reviewCount, stock, sold, vendorName, categoryName → sensible
 *    defaults (0 / "") — not displayed when 0 by ProductCard conditionally.
 *  - price: item.price / 100 — centimes → major units.
 */
function mapWishlistItemToProductCard(item: WishlistPageItem) {
  return {
    id: item.product_id,
    slug: "",
    name: item.name,
    price: item.price / 100,
    thumbnail: item.image_url ?? "",
    rating: 0,
    reviewCount: 0,
    stock: 0,
    sold: 0,
    vendorName: "",
    categoryName: "",
  };
}

// ─── Inline helpers ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[160px] sm:w-[200px]">
      <div className="aspect-square rounded-2xl bg-muted animate-pulse mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded-lg w-4/5" />
        <div className="h-4 bg-muted animate-pulse rounded-lg w-3/5" />
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
      aria-label="Chargement de la liste de souhaits"
      aria-busy="true"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border-light bg-background p-8 lg:p-16 text-center">
      <div className="flex items-center justify-center mb-4">
        <Heart
          size={48}
          className="text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <p className="text-base font-semibold text-foreground lg:text-lg">
        Votre liste de souhaits est vide
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        Ajoutez vos produits préférés en cliquant sur le cœur
      </p>
      <Link href="/">
        <Button variant="primary" size="md" className="mt-6">
          Découvrir le catalogue
        </Button>
      </Link>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * Inner component: always renders with hooks (no conditional hook calls).
 * Only mounted when the user IS authenticated.
 */
function WishlistPageInner() {
  const { data, isLoading, isError, refetch } = useWishlistPage();

  if (isLoading) {
    return <SkeletonGrid />;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-border-light bg-background p-8 text-center">
        <p className="text-base font-semibold text-foreground">
          Impossible de charger votre liste de souhaits
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Une erreur est survenue. Veuillez réessayer.
        </p>
        <Button
          variant="primary"
          size="md"
          className="mt-4"
          onClick={() => void refetch()}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  const items = data?.wishlist.items ?? [];

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ProductCard
          key={item.product_id}
          product={mapWishlistItemToProductCard(item)}
        />
      ))}
    </div>
  );
}

/**
 * WishlistPageClient — outer component.
 * Renders a neutral unauthenticated state if somehow the auth layout guard
 * is bypassed (edge case). Otherwise mounts <WishlistPageInner> which owns
 * all React hooks unconditionally (no conditional hook call violation).
 */
export function WishlistPageClient() {
  if (!hasAuthSession()) {
    return (
      <div className="rounded-2xl border border-border-light bg-background p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour voir votre liste de souhaits
        </p>
        <Link href="/login?redirect=/account/wishlist">
          <Button variant="primary" size="md" className="mt-4">
            Se connecter
          </Button>
        </Link>
      </div>
    );
  }

  return <WishlistPageInner />;
}
