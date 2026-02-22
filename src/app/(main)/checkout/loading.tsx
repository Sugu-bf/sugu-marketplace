import { Skeleton, Container } from "@/components/ui";

/**
 * Checkout page loading skeleton — mirrors the real page layout.
 * Reflects: stepper + agency preview + method selection + address preview + order summary.
 */
export default function CheckoutPageLoading() {
  return (
    <main className="pb-12">
      {/* Breadcrumb skeleton */}
      <Container className="pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </Container>

      {/* Title */}
      <Container className="pb-4">
        <Skeleton className="h-8 w-36" />
      </Container>

      {/* Stepper skeleton */}
      <Container className="pb-8">
        <div className="flex items-center justify-between">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <Skeleton circle className="h-9 w-9" />
                <Skeleton className="h-3 w-14" />
              </div>
              {i < 3 && (
                <div className="flex-1 mx-2 sm:mx-3">
                  <Skeleton className="h-0.5 w-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </Container>

      {/* Two-column layout */}
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agency preview card */}
            <div className="rounded-2xl border border-border-light bg-background p-5">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            {/* Shipping methods card */}
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4.5 w-4.5" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="h-3 w-48" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-border px-4 py-3.5"
                >
                  <Skeleton circle className="h-5 w-5" />
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>

            {/* Address preview card */}
            <div className="rounded-2xl border border-border-light bg-background p-5">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-4 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>

          {/* Right column — Order summary */}
          <div className="lg:col-span-1">
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

                <div className="flex gap-2">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>

                <Skeleton className="h-12 w-full rounded-full" />
                <Skeleton className="h-4 w-48 mx-auto" />

                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-16 rounded-xl" />
                  <Skeleton className="h-16 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
