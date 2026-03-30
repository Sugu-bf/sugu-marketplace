import { createMetadata } from "@/lib/metadata";
import { Breadcrumb, Badge, Button } from "@/components/ui";
import { queryOrders } from "@/features/account";
import { formatPrice } from "@/lib/constants";
import { Eye, Package, CreditCard, Truck, CheckCircle2 } from "lucide-react";
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
  canceled: { label: "Annulée", variant: "danger" },
};

// COD Mixte step labels for the orders list
const COD_STEP_LABELS: Record<string, string> = {
  awaiting_vendor: "Attente vendeur",
  awaiting_negotiation: "Négociation",
  awaiting_delivery_payment: "Payer livraison",
  awaiting_pickup: "Collecte",
  awaiting_inspection: "Inspection",
  awaiting_product_payment: "Payer produit",
  awaiting_code: "Code livraison",
  completed: "Terminée",
};

export default async function OrdersPage() {
  const { orders, pagination } = await queryOrders();

  return (
    <div className="space-y-4 lg:space-y-6">
      <div>
        <Breadcrumb items={[{ label: "Mon compte", href: "/account" }, { label: "Mes commandes" }]} />
        <h1 className="text-lg font-bold text-foreground lg:text-2xl mt-3">Mes commandes</h1>
        <p className="mt-1 text-sm text-muted-foreground">{pagination.total} commande{pagination.total > 1 ? "s" : ""}</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-background p-8 lg:p-12 text-center">
          <Package size={48} className="text-muted-foreground mx-auto mb-4" />
          <p className="text-base font-semibold text-foreground lg:text-lg">Aucune commande</p>
          <p className="text-sm text-muted-foreground mt-1">Vous n&apos;avez pas encore passé de commande.</p>
          <Link href="/">
            <Button variant="primary" size="md" className="mt-4">Commencer à acheter</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 lg:space-y-4">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.statusCode ?? ""] ?? STATUS_CONFIG.pending;
            const isCodMixte = order.is_cod && order.cod_flow_type === "mixte";
            const codStep = order.cod_current_step ? COD_STEP_LABELS[order.cod_current_step] : null;
            const isActionRequired =
              order.cod_current_step === "awaiting_delivery_payment" ||
              order.cod_current_step === "awaiting_product_payment";

            return (
              <div key={order.id} className="rounded-2xl border border-border-light bg-background p-4 lg:p-6 transition-all duration-200 active:bg-white/40 lg:hover:shadow-sm">
                {/* Order header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 lg:gap-3 lg:mb-4">
                  <div>
                    <p className="text-sm font-bold text-foreground">{order.displayId}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{order.date}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={config.variant} size="sm" pill>{config.label}</Badge>
                    {/* COD Mixte payment badge */}
                    {isCodMixte && (
                      <CodMixteBadge
                        deliveryFeePaid={order.delivery_fee_paid ?? false}
                        productFeePaid={order.product_fee_paid ?? false}
                      />
                    )}
                    <Link href={`/track-order?id=${order.id}`}>
                      <Button variant="ghost" size="xs"><Eye size={14} /> Détails</Button>
                    </Link>
                  </div>
                </div>

                {/* COD Mixte step indicator */}
                {isCodMixte && codStep && (
                  <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-3 text-xs font-medium ${
                    isActionRequired
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : order.cod_current_step === "completed"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    {isActionRequired ? (
                      <CreditCard size={14} />
                    ) : order.cod_current_step === "completed" ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Truck size={14} />
                    )}
                    <span>COD Mixte : {codStep}</span>
                    {/* Mini progress dots */}
                    <div className="ml-auto flex gap-1">
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${order.delivery_fee_paid ? "bg-green-500" : "bg-gray-300"}`} title="Livraison" />
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${order.product_fee_paid ? "bg-green-500" : "bg-gray-300"}`} title="Produit" />
                    </div>
                  </div>
                )}

                {/* Items preview */}
                <div className="space-y-2.5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 lg:gap-3">
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-muted lg:h-10 lg:w-10">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-contain p-1" sizes="40px" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-foreground flex-1 truncate lg:text-sm">{item.name}</p>
                      <span className="text-xs text-muted-foreground">×{item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-light lg:mt-4">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-base font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── COD Mixte Payment Badge ────────────────────────────────────

function CodMixteBadge({
  deliveryFeePaid,
  productFeePaid,
}: {
  deliveryFeePaid: boolean;
  productFeePaid: boolean;
}) {
  const bothPaid = deliveryFeePaid && productFeePaid;
  const onePaid = deliveryFeePaid || productFeePaid;

  if (bothPaid) {
    return (
      <Badge variant="success" size="sm" pill>
        COD ✓
      </Badge>
    );
  }

  if (onePaid) {
    return (
      <Badge variant="warning" size="sm" pill>
        COD ½
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" size="sm" pill>
      COD
    </Badge>
  );
}
