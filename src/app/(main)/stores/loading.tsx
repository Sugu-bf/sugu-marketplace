import { Skeleton, Container } from "@/components/ui";

export default function StoresLoading() {
  return (
    <>
      {/* ─── Breadcrumb Skeleton ──────────────────────────────── */}
      <Container className="py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-2" />
          <Skeleton className="h-4 w-20" />
        </div>
      </Container>

      {/* ─── Hero Skeleton ───────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-700 to-primary">
        <Container className="py-10 sm:py-14 lg:py-16">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-7 rounded bg-white/20" />
              <Skeleton className="h-9 w-56 bg-white/20" />
            </div>
            <Skeleton className="h-5 w-80 bg-white/15" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-32 rounded-full bg-white/15" />
              <Skeleton className="h-8 w-28 rounded-full bg-white/15" />
            </div>
          </div>
        </Container>
        <div className="h-6 sm:h-8 bg-gradient-to-b from-transparent to-background" />
      </section>

      {/* ─── Content Skeleton ────────────────────────────────── */}
      <Container as="section" className="py-6 sm:py-8">
        {/* Filter bar */}
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-[220px] rounded-full" />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-24 rounded-full flex-shrink-0"
            />
          ))}
        </div>

        {/* Featured stores header */}
        <Skeleton className="h-7 w-44 mb-6" />

        {/* Featured stores scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[260px] sm:w-[280px] rounded-2xl border border-border-light overflow-hidden"
            >
              <Skeleton className="h-[80px] w-full" />
              <div className="p-4 flex flex-col items-center gap-3">
                <Skeleton circle className="h-14 w-14 -mt-7 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          ))}
        </div>

        {/* All stores header */}
        <Skeleton className="h-7 w-40 mb-6" />

        {/* Store cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border-light p-4 sm:p-5"
            >
              <div className="flex items-start gap-4">
                <Skeleton circle className="h-[60px] w-[60px] sm:h-[70px] sm:w-[70px] rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-28" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
                <div className="flex-shrink-0 space-y-2 flex flex-col items-end">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-9 rounded-lg" />
          ))}
        </div>
      </Container>
    </>
  );
}
