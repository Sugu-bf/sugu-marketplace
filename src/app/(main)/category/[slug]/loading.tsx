import { Skeleton, Container } from "@/components/ui";

export default function CategoryLoading() {
  return (
    <>
      {/* ─── Hero Skeleton ─────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-700 to-primary">
        <Container className="py-10 sm:py-14 lg:py-16">
          <div className="flex items-center gap-6 lg:gap-10">
            <div className="flex-1 space-y-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 bg-white/20" />
                <Skeleton className="h-3 w-2 bg-white/10" />
                <Skeleton className="h-4 w-20 bg-white/20" />
                <Skeleton className="h-3 w-2 bg-white/10" />
                <Skeleton className="h-4 w-32 bg-white/20" />
              </div>
              {/* Title */}
              <Skeleton className="h-10 w-72 bg-white/20" />
              {/* Description */}
              <Skeleton className="h-5 w-full max-w-xl bg-white/15" />
              {/* Badges */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-28 rounded-full bg-white/15" />
                <Skeleton className="h-8 w-36 rounded-full bg-white/15" />
              </div>
            </div>
            {/* Image placeholder */}
            <div className="hidden sm:block">
              <Skeleton className="h-32 w-32 lg:h-40 lg:w-40 rounded-2xl bg-white/10" />
            </div>
          </div>
        </Container>
        {/* Wave */}
        <div className="h-6 sm:h-8 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* ─── Content Skeleton ──────────────────────────────────── */}
      <Container as="section" className="py-6 sm:py-8">
        {/* Subcategory chips */}
        <div className="mb-6 flex gap-3 overflow-x-auto">
          <Skeleton className="h-10 w-24 rounded-full flex-shrink-0" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-10 w-32 rounded-full flex-shrink-0"
            />
          ))}
        </div>

        {/* Sort bar */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-border-light bg-background p-3 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg hidden sm:block" />
          </div>
        </div>

        {/* Main area */}
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="rounded-2xl border border-border-light bg-background p-5 shadow-sm">
              <Skeleton className="mb-4 h-6 w-20" />
              {/* Subcategory filters */}
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
                {Array.from({ length: 5 }).map((_, i) => (
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

          {/* Product Grid */}
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
            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center gap-1.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-9 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
