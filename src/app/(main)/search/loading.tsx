import { Skeleton, Container } from "@/components/ui";

export default function SearchLoading() {
  return (
    <Container as="section" className="py-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-3 w-2" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-2" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Heading skeleton */}
      <div className="mb-6">
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="mt-2 h-4 w-52" />
      </div>

      {/* Related searches skeleton */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-8 w-24 rounded-full"
          />
        ))}
      </div>

      {/* Sort bar skeleton */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-border-light bg-background p-3 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg hidden sm:block" />
        </div>
      </div>

      {/* Main area */}
      <div className="flex gap-6">
        {/* Sidebar skeleton (desktop only) */}
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-border-light bg-background p-5 shadow-sm">
            <Skeleton className="mb-4 h-6 w-20" />
            {/* Category filters */}
            <div className="space-y-3 mb-6">
              <Skeleton className="h-4 w-28" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
            {/* Price filters */}
            <div className="space-y-3 mb-6">
              <Skeleton className="h-4 w-12" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton circle className="h-4 w-4" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
            {/* Rating */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-28" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Product grid skeleton */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
              </div>
            ))}
          </div>
          {/* Pagination skeleton */}
          <div className="mt-8 flex items-center justify-center gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
