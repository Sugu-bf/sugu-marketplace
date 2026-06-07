/**
 * /account/wishlist loading skeleton — Lot 5.
 *
 * Next.js App Router route-level loading UI. Rendered automatically during
 * the navigation transition to /account/wishlist.
 *
 * IMPORTANT: NO imports from @/features/wishlist (Server Component — must
 * not pull client hooks via the wishlist barrel).
 */

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

function SkeletonProductCard() {
  return (
    <div className="flex-shrink-0">
      {/* Image placeholder */}
      <SkeletonPulse className="aspect-square rounded-2xl mb-3 w-full" />
      {/* Name */}
      <SkeletonPulse className="h-4 w-4/5 mb-2" />
      {/* Price */}
      <SkeletonPulse className="h-5 w-2/5" />
    </div>
  );
}

export default function WishlistPageLoading() {
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* ── Header skeleton ── */}
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-3">
          <SkeletonPulse className="h-3 w-20" />
          <SkeletonPulse className="h-3 w-4" />
          <SkeletonPulse className="h-3 w-32" />
        </div>
        {/* h1 */}
        <SkeletonPulse className="h-8 w-48 mt-3" />
        {/* sub-text */}
        <SkeletonPulse className="h-4 w-72 mt-2" />
      </div>

      {/* ── Product card grid skeleton ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    </div>
  );
}
