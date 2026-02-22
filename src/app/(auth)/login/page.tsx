import { createMetadata } from "@/lib/metadata";
import {
  queryCountryCodes,
  queryDefaultCountryCode,
  querySocialProviders,
} from "@/features/auth";
import { LoginPageClient } from "@/features/auth/components/LoginPageClient";

export const metadata = createMetadata({
  title: "Connexion",
  description:
    "Connectez-vous à votre compte Sugu par email, téléphone ou réseau social.",
  path: "/login",
  noIndex: true,
});

/**
 * Login page — Server Component.
 * Fetches mock data via queries and passes to client shell.
 */
export default async function LoginPage() {
  const [countryCodes, defaultCountryCode, socialProviders] = await Promise.all(
    [queryCountryCodes(), queryDefaultCountryCode(), querySocialProviders()]
  );

  return (
    <LoginPageClient
      countryCodes={countryCodes}
      defaultCountryCode={defaultCountryCode}
      socialProviders={socialProviders}
    />
  );
}
