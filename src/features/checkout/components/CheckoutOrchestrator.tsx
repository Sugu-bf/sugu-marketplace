"use client";

import { useState, useCallback, useMemo } from "react";
import { DeliveryAgencyPreview } from "./DeliveryAgencyPreview";
import { DeliveryAgencyModal } from "./DeliveryAgencyModal";
import { ShippingMethodCard } from "./ShippingMethodCard";
import { AddressPreview } from "./AddressPreview";
import { AddressModal } from "./AddressModal";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";
import { Package } from "lucide-react";
import type {
  CheckoutPageData,
  ShippingAddress,
} from "@/features/checkout";

interface CheckoutOrchestratorProps {
  initialData: CheckoutPageData;
}

/**
 * Checkout page orchestrator — manages the complete checkout flow:
 * 1. Select a delivery agency (via modal)
 * 2. Select a shipping method from that agency (inline)
 * 3. View/change delivery address (via modal)
 *
 * Client component — the single client boundary for the checkout page.
 */
function CheckoutOrchestrator({ initialData }: CheckoutOrchestratorProps) {
  // ─── State ───────────────────────────────────────────────
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(
    initialData.selectedAgencyId
  );
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    initialData.selectedShippingMethodId
  );
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    initialData.selectedAddressId
  );
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>(
    initialData.savedAddresses
  );

  // Modal states
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // ─── Derived data ────────────────────────────────────────
  const selectedAgency = useMemo(
    () =>
      initialData.deliveryAgencies.find((a) => a.id === selectedAgencyId) ??
      null,
    [selectedAgencyId, initialData.deliveryAgencies]
  );

  const agencyMethods = useMemo(
    () =>
      selectedAgencyId
        ? initialData.shippingMethods.filter(
            (m) => m.agencyId === selectedAgencyId
          )
        : [],
    [selectedAgencyId, initialData.shippingMethods]
  );

  const selectedMethod = useMemo(
    () => initialData.shippingMethods.find((m) => m.id === selectedMethodId),
    [selectedMethodId, initialData.shippingMethods]
  );

  const selectedAddress = useMemo(
    () => savedAddresses.find((a) => a.id === selectedAddressId) ?? null,
    [selectedAddressId, savedAddresses]
  );

  const shippingCost = selectedMethod?.price ?? 0;
  const total = initialData.subtotal + shippingCost - initialData.discount;

  // ─── Handlers ────────────────────────────────────────────
  const handleSelectAgency = useCallback(
    (id: string) => {
      if (id !== selectedAgencyId) {
        setSelectedAgencyId(id);
        setSelectedMethodId(null); // reset method when agency changes
      }
    },
    [selectedAgencyId]
  );

  const handleSelectMethod = useCallback((id: string) => {
    setSelectedMethodId(id);
  }, []);

  const handleSelectAddress = useCallback((id: number) => {
    setSelectedAddressId(id);
  }, []);

  const handleCreateAddress = useCallback(
    (newAddr: Omit<ShippingAddress, "id" | "isDefault">) => {
      const created: ShippingAddress = {
        ...newAddr,
        id: Date.now(), // mock ID
        isDefault: false,
      };
      setSavedAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
    },
    []
  );

  // ─── Render ──────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        {/* ═══ Left Column ═══ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── 1. Delivery Agency Preview ── */}
          <section aria-labelledby="agency-title">
            <h2 id="agency-title" className="sr-only">
              Agence de livraison
            </h2>
            <DeliveryAgencyPreview
              agency={selectedAgency}
              onEdit={() => setIsAgencyModalOpen(true)}
            />
          </section>

          {/* ── 2. Shipping Methods (shown after agency selection) ── */}
          {selectedAgencyId && agencyMethods.length > 0 && (
            <section
              aria-labelledby="shipping-methods-title"
              className="animate-fade-slide-up"
            >
              <div className="rounded-2xl border border-border-light bg-background p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Package size={18} className="text-primary" />
                  <h2
                    id="shipping-methods-title"
                    className="text-base font-bold text-foreground"
                  >
                    Méthode de livraison
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Options disponibles pour{" "}
                  <span className="font-semibold text-foreground">
                    {selectedAgency?.name}
                  </span>
                </p>

                <div
                  className="space-y-3"
                  role="radiogroup"
                  aria-label="Méthode de livraison"
                >
                  {agencyMethods.map((method) => (
                    <ShippingMethodCard
                      key={method.id}
                      method={method}
                      isSelected={method.id === selectedMethodId}
                      onSelect={handleSelectMethod}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── 3. Shipping Address Preview ── */}
          {selectedAddress && (
            <AddressPreview
              address={selectedAddress}
              onEdit={() => setIsAddressModalOpen(true)}
            />
          )}
        </div>

        {/* ═══ Right Column — Order Summary ═══ */}
        <div className="lg:col-span-1">
          <CheckoutOrderSummary
            items={initialData.orderItems}
            subtotal={initialData.subtotal}
            shippingCost={shippingCost}
            discount={initialData.discount}
            total={total}
            initialCouponCode={initialData.couponCode}
            shippingLabel={
              selectedMethod?.icon === "zap" ? "Express" : undefined
            }
          />
        </div>
      </div>

      {/* ═══ Agency Selection Modal ═══ */}
      <DeliveryAgencyModal
        open={isAgencyModalOpen}
        onClose={() => setIsAgencyModalOpen(false)}
        agencies={initialData.deliveryAgencies}
        selectedAgencyId={selectedAgencyId}
        onSelectAgency={handleSelectAgency}
      />

      {/* ═══ Address Selection Modal ═══ */}
      <AddressModal
        open={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        addresses={savedAddresses}
        selectedAddressId={selectedAddressId}
        onSelectAddress={handleSelectAddress}
        onCreateAddress={handleCreateAddress}
      />
    </>
  );
}

export { CheckoutOrchestrator };
