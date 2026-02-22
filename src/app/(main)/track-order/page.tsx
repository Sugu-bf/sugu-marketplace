import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb, Stepper } from "@/components/ui";
import { AssuranceBadge } from "@/components/ui/assurance-badge";
import { queryTrackedOrder } from "@/features/order";
import { TrackingMap } from "@/features/order/components/TrackingMap";
import { DeliveryDetails } from "@/features/order/components/DeliveryDetails";
import { TrackingTimeline } from "@/features/order/components/TrackingTimeline";
import { TrackingOrderSummary } from "@/features/order/components/TrackingOrderSummary";
import { EstimatedDeliveryCard } from "@/features/order/components/EstimatedDeliveryCard";
import { Lock, Truck, ShieldCheck } from "lucide-react";
import type { StepperStep } from "@/components/ui";

// ─── SEO Metadata ────────────────────────────────────────────

export const metadata = createMetadata({
  title: "Suivre ma commande",
  description:
    "Suivez l'état de votre commande en temps réel sur Sugu. Livraison rapide et suivi détaillé.",
  path: "/track-order",
  noIndex: true,
});

// ─── Page Component (Server) ─────────────────────────────────

export default async function TrackOrderPage() {
  const order = await queryTrackedOrder();

  const breadcrumbItems = [{ label: "Suivi de commande" }];

  // Map tracking steps to Stepper format
  const stepperSteps: StepperStep[] = order.trackingSteps.map((s) => ({
    id: s.id,
    label: s.label,
    subLabel: s.dateLabel,
  }));

  const completedStepIds = order.trackingSteps
    .filter((s) => s.status === "completed")
    .map((s) => s.id);

  const currentStepId =
    order.trackingSteps.find((s) => s.status === "current")?.id ?? "";

  return (
    <main className="pb-12">
      {/* Breadcrumb */}
      <Container className="pt-4 pb-2">
        <Breadcrumb items={breadcrumbItems} />
      </Container>

      {/* Page Header */}
      <Container className="pb-6">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Suivi de commande
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Commande{" "}
          <span className="font-semibold text-foreground">
            #{order.orderNumber}
          </span>
        </p>
      </Container>

      {/* Two-column layout */}
      <Container>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
          {/* ═══ Left Column ═══ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tracking Stepper */}
            <section className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
              <Stepper
                steps={stepperSteps}
                currentStepId={currentStepId}
                completedStepIds={completedStepIds}
              />
            </section>

            {/* Live Tracking Map */}
            <TrackingMap />

            {/* Delivery Details */}
            <DeliveryDetails
              agencyName={order.agencyName}
              agencyRating={order.agencyRating}
              shippingMethod={order.shippingMethod}
              deliveryAddress={order.deliveryAddress}
              driver={order.driver}
            />

            {/* Activity Timeline */}
            <TrackingTimeline events={order.timeline} />
          </div>

          {/* ═══ Right Column ═══ */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <TrackingOrderSummary
              items={order.items}
              subtotal={order.subtotal}
              shippingCost={order.shippingCost}
              shippingLabel={order.shippingLabel}
              discount={order.discount}
              total={order.total}
              paymentMethod={order.paymentMethod}
            />

            {/* Estimated Delivery */}
            <EstimatedDeliveryCard
              estimatedDate={order.estimatedDate}
              timeRange={order.estimatedTimeRange}
              progress={order.deliveryProgress}
            />
          </div>
        </div>
      </Container>

      {/* Trust Badges */}
      <Container className="pt-10 mt-8 border-t border-border-light">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          <AssuranceBadge
            icon={<Lock size={16} />}
            label="Paiement sécurisé"
            className="border-none bg-transparent"
          />
          <AssuranceBadge
            icon={<Truck size={16} />}
            label="Suivi en temps réel"
            className="border-none bg-transparent"
          />
          <AssuranceBadge
            icon={<ShieldCheck size={16} />}
            label="Fraîcheur garantie"
            className="border-none bg-transparent"
          />
        </div>
      </Container>
    </main>
  );
}
