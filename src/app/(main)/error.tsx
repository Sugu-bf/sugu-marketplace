"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

/** Error boundary of the marketplace pages: the header and footer stay in place. */
export default function MainError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} />;
}
