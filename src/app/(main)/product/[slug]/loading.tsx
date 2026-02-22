import { Skeleton, Container } from "@/components/ui";

/**
 * Product page loading skeleton — mirrors the real page layout.
 */
export default function ProductPageLoading() {
  return (
    <main className="pb-12">
      {/* Breadcrumb skeleton */}
      <Container className="pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-40" />
        </div>
      </Container>

      {/* Main product section */}
      <Container className="py-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left — Image gallery */}
          <div className="space-y-3">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Right — Product info */}
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-4" />
                ))}
              </div>
              <Skeleton className="h-4 w-20" />
            </div>

            {/* Vendor */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-7 w-32 rounded-full" />
            </div>

            {/* Pricing card */}
            <Skeleton className="h-28 w-full rounded-xl" />

            {/* Bulk pricing */}
            <Skeleton className="h-40 w-full rounded-xl" />

            {/* Variants */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-16 rounded-full" />
                <Skeleton className="h-9 w-16 rounded-full" />
              </div>
            </div>

            {/* Quantity + buttons */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />

            {/* Assurance badges */}
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </div>
        </div>
      </Container>

      {/* Tabs skeleton */}
      <Container className="py-8 border-t border-border-light">
        <div className="flex gap-4 border-b border-border pb-2 mb-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </Container>

      {/* Related products skeleton */}
      <Container className="py-8 border-t border-border-light">
        <div className="mb-6 flex justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[220px] space-y-3">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
