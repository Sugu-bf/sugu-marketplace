import { Skeleton, Container } from "@/components/ui";

/**
 * Cart page loading skeleton — mirrors the real page layout.
 */
export default function CartPageLoading() {
  return (
    <main className="pb-12">
      {/* Breadcrumb skeleton */}
      <Container className="pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-24" />
        </div>
      </Container>

      {/* Title */}
      <Container className="pb-6">
        <div className="flex items-baseline gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
      </Container>

      {/* Two column layout */}
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Left — Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Sub-header */}
            <div className="flex justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>

            {/* 3 cart item skeletons */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-2xl border border-border-light bg-background p-4"
              >
                <Skeleton className="h-24 w-24 rounded-xl flex-shrink-0 sm:h-28 sm:w-28" />
                <div className="flex-1 space-y-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                    <div className="flex gap-1.5">
                      <Skeleton className="h-5 w-12 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-24 rounded-xl" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
              </div>
            ))}

            {/* Continue shopping */}
            <Skeleton className="h-4 w-40 mt-2" />
          </div>

          {/* Right — Order summary */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border-light bg-background shadow-sm">
              <Skeleton className="h-1 w-full rounded-t-2xl" />
              <div className="p-6 space-y-5">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-7 w-28" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-12 w-full rounded-full" />
                <Skeleton className="h-12 w-full rounded-full" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-18 rounded-xl" />
                  <Skeleton className="h-18 rounded-xl" />
                  <Skeleton className="h-18 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Suggestions skeleton */}
      <Container className="py-10 mt-8 border-t border-border-light">
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
