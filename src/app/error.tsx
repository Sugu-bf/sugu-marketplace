"use client";

import { ErrorFallback } from "@/components/ErrorFallback";

/** Error boundary of every route outside (main): auth pages, invoices, landing page. */
export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback {...props} />;
}
