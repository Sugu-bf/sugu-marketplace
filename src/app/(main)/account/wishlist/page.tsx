/**
 * /account/wishlist — Server Component shell (Lot 5).
 *
 * This file intentionally contains ZERO logic: it is a pure SSR shell that:
 *  1. Declares metadata (noindex — private authenticated route).
 *  2. Renders the page heading aligned with the account page pattern.
 *  3. Delegates all data fetching and interactivity to WishlistPageClient.
 *
 * WishlistPageClient is imported DIRECTLY (not via the wishlist barrel) to
 * avoid pulling client-only hooks into the RSC module graph.
 * cf. memory wishlist-barrel-rsc-boundary.
 *
 * Auth: inherited from the parent layout (src/app/(main)/account/layout.tsx)
 * which calls getAuthUser() + redirect('/login?redirect=/account') for guests.
 */
import { createMetadata } from "@/lib/metadata";
import { Breadcrumb } from "@/components/ui";
import { WishlistPageClient } from "@/features/wishlist/components/WishlistPageClient";

export const metadata = createMetadata({
  title: "Liste de souhaits",
  description: "Retrouvez tous vos produits favoris sur Sugu.",
  path: "/account/wishlist",
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* ── Header ── */}
      <div>
        <Breadcrumb
          items={[
            { label: "Mon compte", href: "/account" },
            { label: "Liste de souhaits" },
          ]}
        />
        <h1 className="text-lg font-bold text-foreground lg:text-2xl mt-3">
          Liste de souhaits
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos produits préférés, sauvegardés pour plus tard
        </p>
      </div>

      {/* ── Content (hydrated client component) ── */}
      <WishlistPageClient />
    </div>
  );
}
