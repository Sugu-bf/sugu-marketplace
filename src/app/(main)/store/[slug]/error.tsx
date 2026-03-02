"use client";

import { AlertTriangle } from "lucide-react";
import { Container } from "@/components/ui";

export default function StoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container as="section" className="py-16">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
          <AlertTriangle size={36} className="text-primary" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-foreground">
          Erreur de chargement
        </h1>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          Une erreur est survenue lors du chargement de cette boutique. Veuillez
          réessayer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-primary-dark"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
          >
            Accueil
          </a>
        </div>
      </div>
    </Container>
  );
}
