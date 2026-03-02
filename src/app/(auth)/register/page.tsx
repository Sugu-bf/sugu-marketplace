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
 */
export default function RegisterPage() {
  return <RegisterPageClient />;
}
