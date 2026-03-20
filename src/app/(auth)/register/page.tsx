import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata";
import { RegisterPageClient } from "@/features/auth/components/RegisterPageClient";

export const metadata = createMetadata({
  title: "Créer un compte",
  description:
    "Inscrivez-vous sur Sugu pour profiter de milliers de produits au meilleur prix.",
  path: "/register",
  noIndex: true,
});

/**
 * Register page — Server Component shell.
 * Suspense requis car RegisterPageClient utilise useSearchParams() (Next.js 15).
 */
export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageClient />
    </Suspense>
  );
}
