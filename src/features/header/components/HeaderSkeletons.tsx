import { Skeleton } from "@/components/ui";

/**
 * Skeleton placeholder for the full marketplace header.
 * Matches the real header's height and layout to prevent CLS.
 */
export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Orange bar skeleton */}
      <div className="h-[60px] bg-gradient-to-r from-primary via-primary-600 to-primary-dark">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-2.5 lg:px-8">
          {/* Logo */}
          <Skeleton className="h-10 w-10 flex-shrink-0 rounded-xl" />
          {/* Categories button */}
          <Skeleton className="h-6 w-36 rounded hidden lg:block" />
          {/* Search bar */}
          <Skeleton className="h-10 flex-1 max-w-xl rounded-full hidden md:block" />
          {/* Nav links */}
          <div className="hidden lg:flex gap-5">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
          {/* Icons */}
          <div className="flex gap-1">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Skeleton for the cart dropdown items.
 */
export function CartDropdownSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
      <div className="pt-3 border-t border-gray-100 space-y-2.5">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton for the wishlist dropdown items.
 */
export function WishlistDropdownSkeleton() {
  return (
    <div className="space-y-2.5 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/4 rounded" />
          </div>
        </div>
      ))}
      <div className="pt-2 border-t border-gray-100">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
