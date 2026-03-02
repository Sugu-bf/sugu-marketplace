import { Skeleton, Container } from "@/components/ui";

export default function StoreLoading() {
  return (
    <>
      {/* ─── Breadcrumb Skeleton ─────────────────────────────── */}
      <Container className="py-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-2" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </Container>

      {/* ─── Cover Skeleton ──────────────────────────────────── */}
      <Container>
        <Skeleton className="h-[180px] sm:h-[240px] rounded-2xl" />
      </Container>

      {/* ─── Profile Card Skeleton ───────────────────────────── */}
      <Container>
        <div className="relative -mt-8 sm:-mt-10 mx-0 sm:mx-4 rounded-2xl bg-white shadow-md border border-border-light p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {/* Logo + Name */}
            <div className="flex items-start gap-4">
              <Skeleton className="h-[72px] w-[72px] sm:h-[80px] sm:w-[80px] rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            {/* Stats + Buttons */}
            <div className="flex-1 flex flex-col gap-4 sm:items-end">
              <div className="flex items-center gap-6">
                <Skeleton className="h-5 w-24" />
                <div className="text-center space-y-1">
                  <Skeleton className="h-6 w-12 mx-auto" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <div className="text-center space-y-1">
                  <Skeleton className="h-6 w-12 mx-auto" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-24 rounded-full" />
                ))}
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-36 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* ─── Products Skeleton ───────────────────────────────── */}
      <Container as="section" className="py-6 sm:py-8">
        {/* Header row */}
        <div className="mb-5 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        {/* Category pills */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
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
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-9 rounded-lg" />
          ))}
        </div>
      </Container>

      {/* ─── About Skeleton ──────────────────────────────────── */}
      <Container as="section" className="pb-10">
        <div className="rounded-2xl border border-border-light bg-white p-5 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left */}
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="space-y-3 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            </div>
            {/* Right */}
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-8" />
                  <Skeleton className="h-2 flex-1 rounded-full" />
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
