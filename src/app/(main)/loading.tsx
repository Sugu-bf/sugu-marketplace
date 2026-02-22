import { Skeleton, Container } from "@/components/ui";

export default function HomeLoading() {
  return (
    <Container>
      {/* Hero banner skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <Skeleton className="aspect-[2.2/1] rounded-2xl" />
        <Skeleton className="aspect-[2.2/1] rounded-2xl hidden sm:block" />
        <Skeleton className="aspect-[2.2/1] rounded-2xl hidden sm:block" />
      </div>
      <Skeleton className="mt-3 h-[120px] sm:h-[160px] rounded-2xl" />

      {/* Category bar skeleton */}
      <div className="flex gap-3 mt-5 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-10 w-24 flex-shrink-0 rounded-full"
          />
        ))}
      </div>

      {/* Fresh categories skeleton */}
      <div className="flex gap-4 mt-6 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-[110px] w-[280px] sm:w-[300px] flex-shrink-0 rounded-2xl"
          />
        ))}
      </div>

      {/* Best Seller section skeleton */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-36" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-32 rounded-full" />
            <div className="hidden sm:flex gap-1.5">
              <Skeleton circle className="h-9 w-9" />
              <Skeleton circle className="h-9 w-9" />
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] sm:w-[220px] space-y-3">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      </div>

      {/* Promotional Deals skeleton */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Skeleton className="h-[180px] rounded-2xl" />
        <Skeleton className="h-[180px] rounded-2xl" />
      </div>

      {/* Trending section skeleton */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 flex-shrink-0 rounded-full" />
          ))}
        </div>
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] sm:w-[220px] space-y-3">
              <Skeleton className="aspect-square rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </div>
      </div>

      {/* Trust badges skeleton */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-2xl" />
        ))}
      </div>
    </Container>
  );
}
