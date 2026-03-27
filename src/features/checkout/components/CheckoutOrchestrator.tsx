"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DeliveryAgencyPreview } from "./DeliveryAgencyPreview";
import { DeliveryAgencyModal } from "./DeliveryAgencyModal";
import { ShippingMethodCard } from "./ShippingMethodCard";
import { AddressPreview } from "./AddressPreview";
import { AddressModal } from "./AddressModal";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";
import { Package, MapPin, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import type {
  CheckoutSessionApi,
  DeliveryPartner,
  DeliveryZone,
  CheckoutLineItem,
  PricingSnapshot,
} from "@/features/checkout/api/checkout.types";
import type {
  DeliveryAgency,
  ShippingMethod,
  ShippingAddress,
  OrderSummaryItem,
} from "@/features/checkout";
import {
  getCheckoutSession,
  createCheckoutSession,
  updateCheckoutSession,
  applyCoupon as applyCouponApi,
  removeCoupon as removeCouponApi,
  placeOrder,
  checkoutErrorMessage,
  isConflictError,
} from "@/features/checkout/api/checkout.api";
import { destroyCartAfterOrder } from "@/features/cart/events/destroy-cart";
import { formatPrice } from "@/lib/constants";

// ─── Props ───────────────────────────────────────────────────

interface CheckoutOrchestratorProps {
  session: CheckoutSessionApi;
  partners: DeliveryPartner[];
  zones: DeliveryZone[];
  sessionId: string;
}

// ─── Mapping helpers (backend → existing UI types) ───────────
// ZERO UI changes: we map backend shapes to the existing component props

function mapPartnersToAgencies(partners: DeliveryPartner[]): DeliveryAgency[] {
  return partners.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.code,
    logo: p.logo_url || "/brands/default.png",
    rating: p.rating_avg,
    reviewCount: p.rating_count,
  }));
}

function mapRatesToShippingMethods(partners: DeliveryPartner[]): ShippingMethod[] {
  const methods: ShippingMethod[] = [];
  for (const partner of partners) {
    for (const rate of partner.rates) {
      methods.push({
        id: rate.id,
        agencyId: partner.id,
        name: rate.service_name || "Standard",
        description: rate.zone_name || "Livraison",
        price: rate.flat_amount,
        estimatedDays: rate.zone_name || "2-5 jours",
        icon: rate.service_code === "express" ? "zap" : rate.service_code === "pickup" ? "store" : "truck",
      });
    }
  }
  return methods;
}

function mapLineItemsToOrderItems(
  lineItems: CheckoutLineItem[] | undefined
): OrderSummaryItem[] {
  if (!lineItems || lineItems.length === 0) return [];
  return lineItems.map((line) => ({
    productId: parseInt(line.product_id, 10) || 0,
    name: line.name,
    quantity: line.qty,
    price: line.unit_price,
    thumbnail: line.image || "/products/default.png",
  }));
}

function getTotals(session: CheckoutSessionApi): PricingSnapshot {
  return session.totals;
}

// ─── Component ───────────────────────────────────────────────

/**
 * Checkout page orchestrator — manages the complete checkout flow.
 *
 * ALL TOTALS COME FROM THE BACKEND. The front never calculates prices.
 * After each mutation, the session is refreshed from the backend.
 *
 * Client component — the single client boundary for the checkout page.
 */
function CheckoutOrchestrator({
  session: initialSession,
  partners,
  zones: _zones,
  sessionId,
}: CheckoutOrchestratorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ─── State ───────────────────────────────────────────────
  const [session, setSession] = useState(initialSession);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  // Saved addresses (from user account — for the address selection modal)
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);

  // Loading/error states
  const [placingOrder, setPlacingOrder] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Payment method state (WARN-01 fix)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cod" | "cinetpay">("cod");

  // Modal states
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // ─── Mapped data for UI components ───────────────────────
  const deliveryAgencies = useMemo(
    () => mapPartnersToAgencies(partners),
    [partners]
  );

  const shippingMethods = useMemo(
    () => mapRatesToShippingMethods(partners),
    [partners]
  );

  const lineItems = useMemo(() => {
    const totals = session.totals;
    // lineItems can be in either `line_items` or `lineItems` key
    const items = totals.line_items || totals.lineItems || [];
    return items;
  }, [session.totals]);

  const orderItems = useMemo(
    () => mapLineItemsToOrderItems(lineItems),
    [lineItems]
  );

  // ─── Derived data ────────────────────────────────────────
  const selectedAgency = useMemo(
    () => deliveryAgencies.find((a) => a.id === selectedAgencyId) ?? null,
    [selectedAgencyId, deliveryAgencies]
  );

  const agencyMethods = useMemo(
    () =>
      selectedAgencyId
        ? shippingMethods.filter((m) => m.agencyId === selectedAgencyId)
        : [],
    [selectedAgencyId, shippingMethods]
  );

  const selectedMethod = useMemo(
    () => shippingMethods.find((m) => m.id === selectedMethodId),
    [selectedMethodId, shippingMethods]
  );

  // ─── Totals from backend (SOURCE OF TRUTH) ──────────────
  const totals = getTotals(session);
  const subtotal = totals.subtotal;
  const discount = totals.discount_amount;
  const shippingCost = selectedMethod?.price ?? totals.shipping_amount;
  const total = totals.grand_total;

  // ─── Address state ───────────────────────────────────────
  const displayAddress = useMemo((): ShippingAddress | null => {
    if (savedAddresses.length > 0) {
      if (selectedAddressId !== null) {
        return savedAddresses.find((a) => a.id === selectedAddressId) ?? savedAddresses[0];
      }
      // Auto-select default or first
      const defaultAddr = savedAddresses.find((a) => a.isDefault);
      return defaultAddr ?? savedAddresses[0];
    }
    return null;
  }, [savedAddresses, selectedAddressId]);

  const hasAddress = displayAddress !== null;

  // ─── Refresh session from backend ────────────────────────
  const refreshSession = useCallback(async () => {
    try {
      const updated = await getCheckoutSession(sessionId);
      setSession(updated);
      return updated;
    } catch (err) {
      setActionError(checkoutErrorMessage(err));
      return null;
    }
  }, [sessionId]);

  // ─── Handlers ────────────────────────────────────────────
  const handleSelectAgency = useCallback(
    (id: string) => {
      if (id !== selectedAgencyId) {
        setSelectedAgencyId(id);
        setSelectedMethodId(null);
        setActionError(null);
      }
    },
    [selectedAgencyId]
  );

  const handleSelectMethod = useCallback((id: string) => {
    setSelectedMethodId(id);
    setActionError(null);
  }, []);

  const handleSelectAddress = useCallback((id: number) => {
    setSelectedAddressId(id);
    setActionError(null);
  }, []);

  const handleCreateAddress = useCallback(
    (newAddr: Omit<ShippingAddress, "id" | "isDefault">) => {
      // Create a local address with a temporary ID
      const tempId = Date.now();
      const newAddress: ShippingAddress = {
        id: tempId,
        ...newAddr,
        isDefault: savedAddresses.length === 0, // First address = default
      };
      setSavedAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(tempId);
      setActionError(null);
    },
    [savedAddresses.length]
  );

  // ─── Coupon handlers ─────────────────────────────────────
  const handleApplyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await applyCouponApi(code);
        await refreshSession();
        return { success: true };
      } catch (err) {
        const message = checkoutErrorMessage(err);
        return { success: false, error: message };
      }
    },
    [refreshSession]
  );

  const handleRemoveCoupon = useCallback(async (): Promise<void> => {
    try {
      await removeCouponApi();
      await refreshSession();
    } catch (err) {
      setActionError(checkoutErrorMessage(err));
    }
  }, [refreshSession]);

  // ─── Place Order handler ─────────────────────────────────
  const handlePlaceOrder = useCallback(
    async (paymentMethod: "cod" | "cinetpay" = "cod") => {
      // Validation checks
      if (!hasAddress) {
        setActionError("Veuillez ajouter une adresse de livraison.");
        return;
      }
      if (!selectedAgencyId) {
        setActionError("Veuillez choisir une agence de livraison.");
        return;
      }
      if (!selectedMethodId) {
        setActionError("Veuillez choisir une méthode de livraison.");
        return;
      }

      setPlacingOrder(true);
      setActionError(null);

      try {
        // ── CRIT-02 FIX: Persist selections on the backend before placing order ──
        const addr = displayAddress!;
        await updateCheckoutSession(sessionId, {
          shipping_address: {
            full_name: addr.fullName,
            phone: addr.phone ?? "",
            line1: addr.street,
            city: addr.city,
            country_code: addr.country === "Burkina Faso" ? "BF" : "BF",
          },
          shipping_partner_id: selectedAgencyId,
          shipping_rate_id: selectedMethodId,
        });

        const result = await placeOrder({
          checkout_session_id: sessionId,
          payment_method: paymentMethod,
        });
        // ✅ Order placed — destroy cart before navigating
        destroyCartAfterOrder();

        if (result.next_step === "redirect_to_payment" && result.payment_url) {
          window.location.href = result.payment_url;
        } else {
          const orderId = result.order.id;
          router.push(`/track-order?order=${orderId}`);
        }
      } catch (err) {
        if (isConflictError(err)) {
          await refreshSession();
          setActionError(
            "Le stock ou les prix ont changé. Veuillez vérifier votre commande."
          );
        } else {
          setActionError(checkoutErrorMessage(err));
        }
      } finally {
        setPlacingOrder(false);
      }
    },
    [hasAddress, selectedAgencyId, selectedMethodId, displayAddress, sessionId, router, refreshSession]
  );

  // ─── Render ──────────────────────────────────────────────
  return (
    <>
      {/* Error banner */}
      {actionError && (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {actionError}
        </div>
      )}

      {/* Warnings from backend (stock/price changes) */}
      {session.warnings && session.warnings.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800 mb-1">
            Attention — modifications détectées :
          </p>
          <ul className="text-xs text-amber-700 space-y-0.5">
            {session.warnings.map((w, i) => (
              <li key={i}>
                {w.type === "stock_limited"
                  ? `Stock limité : seulement ${w.available} unité(s) disponible(s)`
                  : `Le prix a changé pour certains articles`}
              </li>
            ))}
          </ul>
        </div>
      )}

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

          {/* ── 3. Shipping Address ── */}
          <section aria-labelledby="address-title">
            <h2 id="address-title" className="sr-only">
              Adresse de livraison
            </h2>

            {hasAddress ? (
              /* --- Has address → show preview --- */
              <AddressPreview
                address={displayAddress!}
                onEdit={() => setIsAddressModalOpen(true)}
              />
            ) : (
              /* --- No address → prompt to create one --- */
              <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 sm:p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    <MapPin size={24} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      Adresse de livraison requise
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Veuillez ajouter une adresse de livraison pour continuer votre commande.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsAddressModalOpen(true)}
                    className="mt-1"
                  >
                    <Plus size={16} />
                    Ajouter une adresse
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ═══ Right Column — Order Summary ═══ */}
        <div className="lg:col-span-1">
          <CheckoutOrderSummary
            items={orderItems}
            subtotal={subtotal}
            shippingCost={shippingCost}
            discount={discount}
            total={total}
            initialCouponCode={null}
            shippingLabel={
              selectedMethod?.icon === "zap" ? "Express" : undefined
            }
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            onPlaceOrder={handlePlaceOrder}
            isPlacingOrder={placingOrder}
          />
        </div>
      </div>

      {/* ═══ Agency Selection Modal ═══ */}
      <DeliveryAgencyModal
        open={isAgencyModalOpen}
        onClose={() => setIsAgencyModalOpen(false)}
        agencies={deliveryAgencies}
        selectedAgencyId={selectedAgencyId}
        onSelectAgency={handleSelectAgency}
      />

      {/* ═══ Address Selection / Create Modal ═══ */}
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
