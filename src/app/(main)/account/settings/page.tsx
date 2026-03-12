import { createMetadata } from "@/lib/metadata";
import { Breadcrumb } from "@/components/ui";
import { queryAccountPageData } from "@/features/account";
import { SecurityCard } from "@/features/account/components/SecurityCard";
import { PreferencesCard } from "@/features/account/components/PreferencesCard";
import { DataPrivacyCard } from "@/features/account/components/DataPrivacyCard";

export const metadata = createMetadata({ title: "Paramètres du compte", description: "Gérez les paramètres de votre compte Sugu.", path: "/account/settings", noIndex: true });

export default async function SettingsPage() {
  const data = await queryAccountPageData();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Paramètres" }]} />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Paramètres du compte</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez la sécurité et les préférences de votre compte</p>
      </div>

      <SecurityCard security={data.security} />
      <PreferencesCard initialPreferences={data.preferences} />
      <DataPrivacyCard />
    </div>
  );
}
