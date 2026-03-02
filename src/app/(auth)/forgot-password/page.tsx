import { createMetadata } from "@/lib/metadata";
import { ForgotPasswordPageClient } from "@/features/auth/components/ForgotPasswordPageClient";

export const metadata = createMetadata({
  title: "Mot de passe oublié",
  description:
    "Réinitialisez votre mot de passe Sugu par email.",
  path: "/forgot-password",
  noIndex: true,
});

/**
 * Forgot Password page — Server Component shell.
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
