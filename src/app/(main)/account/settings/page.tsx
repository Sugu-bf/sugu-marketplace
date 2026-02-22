import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Button } from "@/components/ui";
import { queryAccountPageData } from "@/features/account";
import { SecurityCard } from "@/features/account/components/SecurityCard";
import { PreferencesCard } from "@/features/account/components/PreferencesCard";
import { Trash2, Download, AlertTriangle } from "lucide-react";

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

      {/* Data & Privacy */}
      <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
        <h2 className="text-base font-bold text-foreground mb-4">Données et confidentialité</h2>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border-light">
            <div className="flex items-center gap-3">
              <Download size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Télécharger mes données</p>
                <p className="text-xs text-muted-foreground">Exportez une copie de vos données personnelles</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Télécharger</Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border-2 border-error/20 bg-error/5">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className="text-error" />
              <div>
                <p className="text-sm font-medium text-error">Supprimer mon compte</p>
                <p className="text-xs text-muted-foreground">Cette action est irréversible</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-error text-error hover:bg-error/10">
              <Trash2 size={14} /> Supprimer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
