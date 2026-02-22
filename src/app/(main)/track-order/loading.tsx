import { Skeleton, Container } from "@/components/ui";

/**
 * Track Order page loading skeleton — mirrors the real page layout.
 */
export default function TrackOrderPageLoading() {
  return (
    <main className="pb-12">
      {/* Breadcrumb */}
      <Container className="pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-32" />
        </div>
      </Container>

      {/* Title */}
      <Container className="pb-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40 mt-2" />
      </Container>

      {/* Two-column layout */}
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stepper */}
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
              <div className="flex items-center justify-between">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Skeleton circle className="h-9 w-9" />
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                    {i < 3 && (
                      <div className="flex-1 mx-2 sm:mx-3">
                        <Skeleton className="h-0.5 w-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <Skeleton className="h-[200px] sm:h-[250px] rounded-2xl" />

            {/* Delivery details */}
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6 space-y-5">
              <Skeleton className="h-5 w-24" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton circle className="h-3.5 w-3.5" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order summary */}
            <div className="rounded-2xl border border-border-light bg-background shadow-sm">
              <Skeleton className="h-1 w-full rounded-t-2xl" />
              <div className="p-5 sm:p-6 space-y-5">
                <Skeleton className="h-6 w-48" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
                <Skeleton className="h-px w-full" />
                <div className="space-y-2.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-7 w-28" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-10 rounded-lg" />
                  <Skeleton className="h-10 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Estimated delivery */}
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        </div>
      </Container>

      {/* Trust badges */}
      <Container className="pt-10 mt-8 border-t border-border-light">
        <div className="flex items-center justify-center gap-10">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton circle className="h-8 w-8" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
