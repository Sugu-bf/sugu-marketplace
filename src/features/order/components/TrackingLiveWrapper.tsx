"use client";

import { useOrderPolling } from "../hooks/useOrderPolling";
import type { TrackedOrder } from "../models/order";
import type { StepperStep } from "@/components/ui";

import { Stepper } from "@/components/ui";
import { TrackingMap } from "./TrackingMap";
import { DeliveryDetails } from "./DeliveryDetails";
import { TrackingTimeline } from "./TrackingTimeline";
import { TrackingOrderSummary } from "./TrackingOrderSummary";
import { EstimatedDeliveryCard } from "./EstimatedDeliveryCard";

interface TrackingLiveWrapperProps {
  orderId: string;
  initialData: TrackedOrder;
}

/**
 * Client wrapper that subscribes to polling updates and re-renders
 * only the data-driven sections. The layout/structure stays SSR.
 *
 * Zero UI changes — same components, same props.
 */
export function TrackingLiveWrapper({
  orderId,
  initialData,
}: TrackingLiveWrapperProps) {
  const { order, isPolling, error } = useOrderPolling(orderId, initialData);

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

  // Determine map status message
  const mapStatusMessage = (() => {
    switch (order.status) {
      case "shipping":
        return "Votre livreur est en route";
      case "delivered":
        return "Votre commande a été livrée";
      case "preparing":
        return "Votre commande est en préparation";
      default:
        return "Votre commande est confirmée";
    }
  })();

  return (
    <>
      {/* Polling status indicator */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Page Header — updates order number reactively */}
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Suivi de commande
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Commande{" "}
        <span className="font-semibold text-foreground">
          #{order.orderNumber}
        </span>
        {isPolling && (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Suivi en direct
          </span>
        )}
      </p>

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
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
          <TrackingMap statusMessage={mapStatusMessage} />

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
    </>
  );
}
