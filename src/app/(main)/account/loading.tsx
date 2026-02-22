import { Skeleton, Container } from "@/components/ui";

/**
 * Account page loading skeleton — mirrors the sidebar + 3 content cards layout.
 */
export default function AccountPageLoading() {
  return (
    <main className="pb-12">
      {/* Breadcrumb */}
      <Container className="pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-24" />
        </div>
      </Container>

      {/* Title */}
      <Container className="pb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </Container>

      {/* Two-column layout */}
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border-light bg-background shadow-sm overflow-hidden">
              {/* Profile header */}
              <div className="p-5 border-b border-border-light">
                <div className="flex items-center gap-3">
                  <Skeleton circle className="h-14 w-14" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              </div>
              {/* Nav items */}
              <div className="p-2 space-y-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-full rounded-xl"
                  />
                ))}
                <div className="my-2 mx-3 border-t border-border-light" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    key={`s-${i}`}
                    className="h-10 w-full rounded-xl"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Personal Info Card */}
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Security Card */}
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl border border-border-light"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Preferences Card */}
            <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
              <Skeleton className="h-5 w-28 mb-5" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                ))}
                <div className="border-t border-border-light" />
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={`s-${i}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-9 w-32 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
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
