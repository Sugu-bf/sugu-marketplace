import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Button } from "@/components/ui";
import { CreditCard, ShoppingBag } from "lucide-react";
import Link from "next/link";

export const metadata = createMetadata({ title: "Mes Paiements", description: "Gérez vos méthodes de paiement sur Sugu.", path: "/account/payments", noIndex: true });

/**
 * Payments page — placeholder.
 *
 * The backend doesn't support saved payment methods.
 * Payments are handled via redirect flow (Moneroo) or COD.
 * This page informs users about the payment flow.
 */
export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Mes paiements" }]} />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Mes paiements</h1>
      </div>

      <div className="rounded-2xl border border-border-light bg-background p-8 lg:p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary mx-auto mb-4">
          <CreditCard size={32} />
        </div>
        <p className="text-base font-semibold text-foreground lg:text-lg">
          Paiements sécurisés à chaque commande
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Nous acceptons Orange Money, Moov Money, les cartes bancaires, et le paiement à la livraison (COD).
          Le paiement est traité de manière sécurisée à chaque commande.
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Consultez vos commandes pour voir l&apos;historique de vos paiements.
        </p>
        <Link href="/account/orders">
          <Button variant="primary" size="md" className="mt-6">
            <ShoppingBag size={16} /> Voir mes commandes
          </Button>
        </Link>
      </div>
    </div>
  );
}
