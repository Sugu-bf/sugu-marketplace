import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Badge, Button } from "@/components/ui";
import { queryOrders } from "@/features/account";
import { formatPrice } from "@/lib/constants";
import { Eye, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const metadata = createMetadata({ title: "Mes Commandes", description: "Consultez l'historique de vos commandes sur Sugu.", path: "/account/orders", noIndex: true });

const STATUS_CONFIG: Record<string, { label: string; variant: "primary" | "success" | "danger" | "secondary" }> = {
  pending: { label: "En attente", variant: "secondary" },
  confirmed: { label: "Confirmée", variant: "primary" },
  processing: { label: "En préparation", variant: "primary" },
  shipped: { label: "En livraison", variant: "primary" },
  delivered: { label: "Livrée", variant: "success" },
  cancelled: { label: "Annulée", variant: "danger" },
};

export default async function OrdersPage() {
  const orders = await queryOrders();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Mes commandes" }]} />
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl mt-3">Mes commandes</h1>
        <p className="mt-1 text-sm text-muted-foreground">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-background p-12 text-center">
          <Package size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground">Aucune commande</p>
          <p className="text-sm text-muted-foreground mt-1">Vous n&apos;avez pas encore passé de commande.</p>
          <Link href="/">
            <Button variant="primary" size="md" className="mt-4">Commencer à acheter</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status];
            return (
              <div key={order.id} className="rounded-2xl border border-border-light bg-background p-5 sm:p-6 transition-all duration-200 hover:shadow-sm">
                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">{order.id}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={config.variant} size="sm" pill>{config.label}</Badge>
                    <Link href={`/track-order?id=${order.id}`}>
                      <Button variant="ghost" size="xs"><Eye size={14} /> Détails</Button>
                    </Link>
                  </div>
                </div>

                {/* Items preview */}
                <div className="space-y-2.5">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image src={item.thumbnail} alt={item.name} fill className="object-contain p-1" sizes="40px" />
                      </div>
                      <p className="text-sm text-foreground flex-1 truncate">{item.name}</p>
                      <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                      <span className="text-sm font-semibold text-foreground">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-light">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-base font-bold text-primary">{formatPrice(order.total)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
