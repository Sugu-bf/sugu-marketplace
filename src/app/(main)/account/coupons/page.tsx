import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Button } from "@/components/ui";
import { Tag, ShoppingCart } from "lucide-react";
import Link from "next/link";

export const metadata = createMetadata({ title: "Mes Coupons", description: "Consultez vos codes promo sur Sugu.", path: "/account/coupons", noIndex: true });

/**
 * Coupons page — placeholder.
 *
 * There is no dedicated buyer-facing coupon list endpoint in the backend.
 * Coupons are applied during checkout (via the cart coupon flow).
 * This page informs users where to use their coupons.
 */
export default function CouponsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Mes coupons" }]} />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Mes coupons</h1>
      </div>

      <div className="rounded-2xl border border-border-light bg-background p-8 lg:p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary mx-auto mb-4">
          <Tag size={32} />
        </div>
        <p className="text-base font-semibold text-foreground lg:text-lg">
          Utilisez vos coupons lors du checkout
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Vous pouvez appliquer vos codes promo directement dans votre panier lors de la commande.
          Les coupons disponibles seront automatiquement suggérés.
        </p>
        <Link href="/cart">
          <Button variant="primary" size="md" className="mt-6">
            <ShoppingCart size={16} /> Voir mon panier
          </Button>
        </Link>
      </div>
    </div>
  );
}
