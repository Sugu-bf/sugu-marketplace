import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata";
import { querySocialProviders } from "@/features/auth";
import { LoginPageClient } from "@/features/auth/components/LoginPageClient";
import LoginLoading from "./loading";

export const metadata = createMetadata({
  title: "Connexion",
  description:
    "Connectez-vous à votre compte Sugu par email ou téléphone.",
  path: "/login",
  noIndex: true,
});

/**
 * Login page — Server Component.
 * Le Suspense est requis car LoginPageClient utilise useSearchParams()
 * pour lire le redirect param (Next.js 15).
 */
export default async function LoginPage() {
  const socialProviders = await querySocialProviders();

  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginPageClient socialProviders={socialProviders} />
    </Suspense>
  );
}
