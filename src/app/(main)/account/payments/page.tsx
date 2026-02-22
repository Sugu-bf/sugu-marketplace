import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Button, Badge } from "@/components/ui";
import { queryPaymentMethods } from "@/features/account";
import { Smartphone, CreditCard, Building2, Plus, Pencil, Trash2 } from "lucide-react";

export const metadata = createMetadata({ title: "Mes Paiements", description: "Gérez vos méthodes de paiement sur Sugu.", path: "/account/payments", noIndex: true });

const TYPE_ICONS: Record<string, React.ReactNode> = {
  mobile_money: <Smartphone size={18} />,
  card: <CreditCard size={18} />,
  bank: <Building2 size={18} />,
};

export default async function PaymentsPage() {
  const methods = await queryPaymentMethods();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Mes paiements" }]} />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Mes paiements</h1>
        </div>
        <Button variant="primary" size="md"><Plus size={16} /> Ajouter un moyen</Button>
      </div>

      <div className="space-y-3">
        {methods.map((pm) => (
          <div key={pm.id} className="flex items-center gap-4 rounded-2xl border border-border-light bg-background p-5 transition-all hover:shadow-sm group">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
              {TYPE_ICONS[pm.type] ?? <CreditCard size={18} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">{pm.label}</p>
                {pm.isDefault && <Badge variant="success" size="xs" pill>Par défaut</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{pm.details}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Modifier">
                <Pencil size={14} />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-error/10 hover:text-error transition-colors" aria-label="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
