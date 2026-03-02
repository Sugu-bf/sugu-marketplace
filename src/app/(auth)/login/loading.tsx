import { Skeleton } from "@/components/ui";

/**
 * Login page skeleton — reflects the real page structure.
 */
export default function LoginLoading() {
  return (
    <div className="space-y-8">
      {/* Title + subtitle */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Email field */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      {/* Password field */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      {/* Forgot password link */}
      <div className="flex justify-end">
        <Skeleton className="h-3 w-36" />
      </div>

      {/* Submit button */}
      <Skeleton className="h-12 w-full rounded-full" />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-px flex-1" />
        <Skeleton className="h-3 w-6" />
        <Skeleton className="h-px flex-1" />
      </div>

      {/* Social buttons */}
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      {/* Footer text */}
      <Skeleton className="mx-auto h-4 w-48" />
    </div>
  );
}
