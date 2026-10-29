"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/container";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  /** Next's error boundary reset: renders the segment again. */
  reset: () => void;
}

/**
 * What an error boundary shows (app/error.tsx, app/(main)/error.tsx) instead
 * of a blank screen: what happened, a retry, a way home, and the error digest
 * the server logs carry, for support. Never the error message itself: it can
 * hold internal details.
 */
export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  const router = useRouter();
  const [retrying, startRetry] = useTransition();

  useEffect(() => {
    console.error("[error-boundary]", error.digest ?? error.name);
  }, [error]);

  // A server component failure needs a fresh server render, not only a
  // client re-render of the segment.
  const retry = () =>
    startRetry(() => {
      router.refresh();
      reset();
    });

  return (
    <Container
      as="section"
      role="alert"
      className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center"
    >
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Une erreur est survenue
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Cette page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant ; si le
        problème persiste, revenez à l&apos;accueil.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-dark disabled:opacity-60"
        >
          {retrying ? "Nouvel essai…" : "Réessayer"}
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border-2 border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary"
        >
          Retour à l&apos;accueil
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-xs text-muted-foreground">Référence : {error.digest}</p>
      )}
    </Container>
  );
}
