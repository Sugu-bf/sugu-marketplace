"use client";

import { useState, type ReactNode } from "react";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isApiError } from "@/lib/api/errors";

/**
 * Whether a failed query gets one more try. The API client already retries
 * idempotent reads itself, so a query only tries again once, and never on a
 * client error: a 4xx (or a 429 without Retry-After) would fail the same way.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false;
  return isApiError(error) && error.isRetryable && !error.isClientError;
}

/** One line per failed query: its key's root and the error code, never data. */
function logQueryError(error: unknown, queryKey: readonly unknown[]): void {
  const scope = typeof queryKey[0] === "string" ? queryKey[0] : "query";
  if (isApiError(error)) {
    console.error(`[query] ${scope} failed: ${error.code} ${error.status}`, error.requestId ?? "");
  } else {
    console.error(`[query] ${scope} failed`, error instanceof Error ? error.message : error);
  }
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => logQueryError(error, query.queryKey),
    }),
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000, // 30 seconds
        retry: shouldRetryQuery,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: reuse singleton
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
