import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Button, Badge } from "@/components/ui";
import { queryAddresses } from "@/features/account";
import { MapPin, Home, Briefcase, Users, Phone, Pencil, Trash2, Plus } from "lucide-react";

export const metadata = createMetadata({ title: "Mes Adresses", description: "Gérez vos adresses de livraison sur Sugu.", path: "/account/addresses", noIndex: true });

const LABEL_ICONS: Record<string, React.ReactNode> = { Domicile: <Home size={18} />, Bureau: <Briefcase size={18} />, Famille: <Users size={18} /> };

export default async function AddressesPage() {
  const addresses = await queryAddresses();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Mes adresses" }]} />
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Mes adresses</h1>
        </div>
        <Button variant="primary" size="md"> <Plus size={16} /> Ajouter une adresse</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div key={addr.id} className="rounded-2xl border border-border-light bg-background p-5 transition-all hover:shadow-sm group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary">
                  {LABEL_ICONS[addr.label] ?? <MapPin size={18} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{addr.label}</p>
                  {addr.isDefault && <Badge variant="success" size="xs" pill>Par défaut</Badge>}
                </div>
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
            <p className="text-sm font-medium text-foreground">{addr.firstName} {addr.lastName}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{addr.street}</p>
            <p className="text-sm text-muted-foreground">{addr.city}, {addr.country}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <Phone size={12} /> {addr.phone}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
