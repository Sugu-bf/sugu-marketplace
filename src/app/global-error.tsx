"use client";

import { ErrorFallback } from "@/components/ErrorFallback";
import "./globals.css";

/**
 * Last-resort boundary: an error in the root layout itself (branding,
 * providers). It replaces the root layout, hence its own <html> and <body>.
 */
export default function GlobalError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <main>
          <ErrorFallback {...props} />
        </main>
      </body>
    </html>
  );
}
