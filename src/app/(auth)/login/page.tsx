import { createMetadata } from "@/lib/metadata";
import { querySocialProviders } from "@/features/auth";
import { LoginPageClient } from "@/features/auth/components/LoginPageClient";

export const metadata = createMetadata({
  title: "Connexion",
  description:
    "Connectez-vous à votre compte Sugu par email ou téléphone.",
  path: "/login",
  noIndex: true,
});

/**
 * Login page — Server Component.
 * Fetches social providers and passes to client shell.
 */
export default async function LoginPage() {
  const socialProviders = await querySocialProviders();

  return <LoginPageClient socialProviders={socialProviders} />;
}
