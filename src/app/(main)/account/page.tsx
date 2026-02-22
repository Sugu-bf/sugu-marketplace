import { createMetadata } from "@/lib/metadata";
import { Breadcrumb } from "@/components/ui";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { queryAccountPageData } from "@/features/account";
import { PersonalInfoCard } from "@/features/account/components/PersonalInfoCard";
import { SecurityCard } from "@/features/account/components/SecurityCard";
import { PreferencesCard } from "@/features/account/components/PreferencesCard";
import { Lock, ShieldCheck, Phone } from "lucide-react";

export const metadata = createMetadata({
  title: "Mon Compte",
  description: "Gérez votre compte, vos commandes et vos préférences sur Sugu.",
  path: "/account",
  noIndex: true,
});

export default async function AccountPage() {
  const data = await queryAccountPageData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumb items={[{ label: "Mon compte" }]} />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">
          Détails du compte
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez vos informations personnelles
        </p>
      </div>

      <PersonalInfoCard profile={data.profile} />
      <SecurityCard security={data.security} />
      <PreferencesCard initialPreferences={data.preferences} />

      {/* Trust badges */}
      <div className="pt-6 mt-2 border-t border-border-light">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          <AssuranceBadge icon={<Lock size={16} />} label="Données sécurisées" className="border-none bg-transparent" />
          <AssuranceBadge icon={<ShieldCheck size={16} />} label="Compte protégé" className="border-none bg-transparent" />
          <AssuranceBadge icon={<Phone size={16} />} label="Support 24/7" className="border-none bg-transparent" />
        </div>
      </div>
    </div>
  );
}
