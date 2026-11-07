"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DeliveryAgencyPreview } from "./DeliveryAgencyPreview";
import { DeliveryAgencyModal } from "./DeliveryAgencyModal";
import { ShippingMethodCard } from "./ShippingMethodCard";
import { AddressPreview } from "./AddressPreview";
import { AddressModal } from "./AddressModal";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";
import { PaymentInitFailedPanel } from "./PaymentInitFailedPanel";
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
  OrderSummaryItem,
} from "@/features/checkout";
import {
  getCheckoutSession,
  updateCheckoutSession,
  applyCoupon as applyCouponApi,
  removeCoupon as removeCouponApi,
  placeOrder,
  checkoutErrorMessage,
  isConflictError,
  isPriceChangedError,
} from "@/features/checkout/api/checkout.api";
import { fetchAddresses, createAddress } from "@/features/account";
import type { Address } from "@/features/account";
import {
  addressToCheckoutPayload,
  draftToAddress,
  draftToAddressInput,
  checkoutAddressToAddress,
  DRAFT_ADDRESS_ID,
  type AddressDraft,
} from "../utils/address";
import { placeOrderNextStep, type UnpaidOnlineOrder } from "../utils/place-order-next-step";
import { emitCartChanged } from "@/features/cart/events/cart-events";
import { DEFAULT_COUNTRY_CODE, formatPrice } from "@/lib/constants";

// ─── Props ───────────────────────────────────────────────────

interface CheckoutOrchestratorProps {
  session: CheckoutSessionApi;
  partners: DeliveryPartner[];
  zones: DeliveryZone[];
  sessionId: string;
  initialPaymentMethod?: "cod" | "ligdicash";
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

/**
 * The rates the buyer can choose: those of the delivery zone of the address.
 * The server prices the delivery from that zone and refuses another one.
 */
export function mapRatesToShippingMethods(
  partners: DeliveryPartner[],
  zoneId: string | null | undefined
): ShippingMethod[] {
  const methods: ShippingMethod[] = [];
  if (!zoneId) return methods;
  for (const partner of partners) {
    for (const rate of partner.rates) {
      if (rate.zone_id !== zoneId) continue;
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
    productId: line.product_id,
    variantId: line.variant_id,
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
  zones,
  sessionId,
  initialPaymentMethod,
}: CheckoutOrchestratorProps) {
  const router = useRouter();
  /** Only the answer to the last delivery choice is applied (rapid clicks). */
  const deliveryRequest = useRef(0);

  // ─── State ───────────────────────────────────────────────
  // Les sélections déjà persistées côté serveur amorcent l'état local : après
  // un rechargement de page, le checkout repart de la session, pas de zéro.
  const [session, setSession] = useState(initialSession);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(
    initialSession.shipping_partner_id ?? null
  );
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    initialSession.shipping_rate_id ?? null
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialSession.shipping_address?.address_id ?? null
  );

  // Saved addresses (from user account — for the address selection modal)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);

  /**
   * Adresse portée par la session mais absente du carnet (saisie à la volée
   * lors d'une session précédente) — permet de réafficher l'adresse après un
   * rechargement même si elle n'a pas d'entrée dans le carnet.
   */
  const [sessionAddress, setSessionAddress] = useState<Address | null>(() =>
    initialSession.shipping_address
      ? checkoutAddressToAddress(initialSession.shipping_address)
      : null
  );

  // Loading/error states
  const [placingOrder, setPlacingOrder] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  /** Commande en ligne créée mais dont le paiement n'a pas pu être lancé. */
  const [unpaidOrder, setUnpaidOrder] = useState<UnpaidOnlineOrder | null>(null);
  /** Avertissement non bloquant (ex : carnet indisponible). */
  const [addressNotice, setAddressNotice] = useState<string | null>(null);

  // Payment method state (WARN-01 fix)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"cod" | "ligdicash">(
    initialPaymentMethod ?? "cod"
  );

  // Modal states
  const [isAgencyModalOpen, setIsAgencyModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // ─── Mapped data for UI components ───────────────────────
  const zoneId = session.shipping_zone_id ?? null;

  const shippingMethods = useMemo(
    () => mapRatesToShippingMethods(partners, zoneId),
    [partners, zoneId]
  );

  // Only the agencies that deliver the zone of the address.
  const deliveryAgencies = useMemo(
    () =>
      mapPartnersToAgencies(
        partners.filter((p) => shippingMethods.some((m) => m.agencyId === p.id))
      ),
    [partners, shippingMethods]
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
  // Every line is the server's, the delivery included: nothing is mixed with
  // a price read locally from the chosen rate.
  const totals = getTotals(session);
  const subtotal = totals.subtotal;
  const discount = totals.discount_amount;
  const shippingCost = totals.shipping_amount;
  const codFee = totals.cod_fee ?? 0;
  const total = totals.grand_total;

  // ─── Address state ───────────────────────────────────────
  /**
   * Adresse effectivement utilisée pour la livraison, par ordre de priorité :
   * sélection explicite → adresse déjà posée sur la session → adresse par
   * défaut du carnet → première du carnet.
   */
  const displayAddress = useMemo((): Address | null => {
    if (selectedAddressId) {
      const picked = savedAddresses.find((a) => a.id === selectedAddressId);
      if (picked) return picked;
    }

    if (sessionAddress) return sessionAddress;

    if (savedAddresses.length > 0) {
      return savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0];
    }

    return null;
  }, [savedAddresses, selectedAddressId, sessionAddress]);

  const hasAddress = displayAddress !== null;

  // The address shown must be the session's: its zone decides the rates.
  const persistedAddress = useRef(false);

  // ─── Load the user's address book ────────────────────────
  // Sans ce chargement, le carnet restait vide et l'acheteur devait ressaisir
  // son adresse à chaque commande.
  useEffect(() => {
    let cancelled = false;

    fetchAddresses()
      .then((addresses) => {
        if (cancelled) return;
        setSavedAddresses(addresses);
      })
      .catch(() => {
        // Le carnet est un confort : son indisponibilité ne doit pas bloquer
        // le checkout, l'acheteur peut toujours saisir une adresse.
        if (!cancelled) setSavedAddresses([]);
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Apply a session the server answered ─────────────────
  // The server may drop a rate (new agency, new address in another zone):
  // the choices shown follow what it kept.
  const applySession = useCallback((updated: CheckoutSessionApi) => {
    setSession(updated);
    setSelectedMethodId(updated.shipping_rate_id ?? null);
    if (updated.shipping_partner_id) {
      setSelectedAgencyId(updated.shipping_partner_id);
    }
  }, []);

  // ─── Refresh session from backend ────────────────────────
  const refreshSession = useCallback(async () => {
    try {
      const updated = await getCheckoutSession(sessionId);
      applySession(updated);
      return updated;
    } catch (err) {
      setActionError(checkoutErrorMessage(err));
      return null;
    }
  }, [sessionId, applySession]);

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

  const handleSelectMethod = useCallback(
    (id: string) => {
      setSelectedMethodId(id);
      setActionError(null);
      const request = ++deliveryRequest.current;

      // Persiste le tarif : le backend recalcule shipping_amount et grand_total,
      // donc le total affiché vient du serveur au lieu d'être déduit localement.
      // Seule la réponse au dernier clic est appliquée.
      updateCheckoutSession(sessionId, {
        shipping_partner_id: selectedAgencyId,
        shipping_rate_id: id,
      })
        .then((updated) => {
          if (request === deliveryRequest.current) applySession(updated);
        })
        .catch((err) => {
          if (request !== deliveryRequest.current) return;
          setSelectedMethodId(session.shipping_rate_id ?? null);
          setActionError(checkoutErrorMessage(err));
        });
    },
    [sessionId, selectedAgencyId, applySession, session.shipping_rate_id]
  );

  /** The buyer names the delivery zone of the address when it says none. */
  const handleSelectZone = useCallback(
    async (zone: DeliveryZone) => {
      const address = session.shipping_address;
      if (!address) return;
      setActionError(null);
      ++deliveryRequest.current;
      try {
        applySession(
          await updateCheckoutSession(sessionId, {
            shipping_address: { ...address, zone_id: zone.id },
          })
        );
      } catch (err) {
        setActionError(checkoutErrorMessage(err));
      }
    },
    [session.shipping_address, sessionId, applySession]
  );

  /**
   * Pousse l'adresse sur la session côté serveur.
   *
   * Fait dès la sélection, et non plus au dernier clic : le serveur connaît
   * l'adresse avant le paiement, et un rechargement de page la retrouve.
   */
  const persistAddressToSession = useCallback(
    async (address: Address) => {
      ++deliveryRequest.current;
      const updated = await updateCheckoutSession(sessionId, {
        shipping_address: addressToCheckoutPayload(address),
      });
      applySession(updated);
    },
    [sessionId, applySession]
  );

  useEffect(() => {
    if (persistedAddress.current || session.shipping_address || !displayAddress) return;
    persistedAddress.current = true;
    persistAddressToSession(displayAddress).catch((err) => {
      setActionError(checkoutErrorMessage(err));
    });
  }, [displayAddress, session.shipping_address, persistAddressToSession]);

  const handleSelectAddress = useCallback(
    (id: string) => {
      setSelectedAddressId(id);
      setActionError(null);
      setAddressNotice(null);

      const address = savedAddresses.find((a) => a.id === id);
      if (!address) return;

      setSessionAddress(null);
      persistAddressToSession(address).catch((err) => {
        setActionError(checkoutErrorMessage(err));
      });
    },
    [savedAddresses, persistAddressToSession]
  );

  const handleCreateAddress = useCallback(
    async (draft: AddressDraft) => {
      setActionError(null);
      setAddressNotice(null);

      const isFirst = savedAddresses.length === 0;

      let address: Address;

      try {
        // L'adresse saisie au checkout entre dans le carnet : la prochaine
        // commande n'aura plus rien à ressaisir.
        address = await createAddress(
          draftToAddressInput(draft, DEFAULT_COUNTRY_CODE, isFirst)
        );
        setSavedAddresses((prev) =>
          isFirst ? [address] : [...prev.map((a) => ({ ...a, isDefault: false })), address]
        );
      } catch {
        // Le carnet est indisponible : on n'empêche pas l'acheteur de commander.
        address = draftToAddress(draft, DEFAULT_COUNTRY_CODE);
        setAddressNotice(
          "Adresse utilisée pour cette commande, mais non enregistrée dans votre carnet."
        );
      }

      const isDraft = address.id === DRAFT_ADDRESS_ID;
      setSessionAddress(isDraft ? address : null);
      setSelectedAddressId(isDraft ? null : address.id);

      // Remonte l'erreur à la modale si la session refuse l'adresse (422) :
      // l'acheteur corrige immédiatement plutôt qu'au clic « Commander ».
      await persistAddressToSession(address);
    },
    [savedAddresses.length, persistAddressToSession]
  );

  // ─── Coupon handlers ─────────────────────────────────────
  // What the summary shows of a coupon is what the session says of it:
  // applied to the totals, or not and why — never a code kept locally.
  const handleApplyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      try {
        await applyCouponApi(code);
      } catch (err) {
        return { success: false, error: checkoutErrorMessage(err) };
      }
      const updated = await refreshSession();
      if (!updated) {
        return { success: false, error: "Le coupon n'a pas pu être vérifié. Réessayez." };
      }
      if (updated.totals.coupon && !updated.totals.coupon.applied) {
        return {
          success: false,
          error: updated.totals.coupon.reason ?? "Ce coupon ne s'applique pas à cette commande.",
        };
      }
      return { success: true };
    },
    [refreshSession]
  );

  const handleRemoveCoupon = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await removeCouponApi();
    } catch (err) {
      return { success: false, error: checkoutErrorMessage(err) };
    }
    await refreshSession();
    return { success: true };
  }, [refreshSession]);

  // ─── Place Order handler ─────────────────────────────────
  const handlePlaceOrder = useCallback(
    async (paymentMethod: "cod" | "ligdicash" = "cod") => {
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
        // L'adresse est renvoyée intégralement (quartier, complément, GPS) et
        // non plus réduite à 5 champs dont un pays écrit en dur.
        await updateCheckoutSession(sessionId, {
          shipping_address: addressToCheckoutPayload(displayAddress!),
          shipping_partner_id: selectedAgencyId,
          shipping_rate_id: selectedMethodId,
        });

        const result = await placeOrder({
          checkout_session_id: sessionId,
          payment_method: paymentMethod,
        });
        // The server took the ordered lines out of the cart with the order:
        // the header only reads the cart again. Nothing is cleared here, so a
        // payment that fails leaves the cart as the server keeps it.
        emitCartChanged({ action: "update" });

        const nextStep = placeOrderNextStep(result);
        if (nextStep.type === "redirect") {
          window.location.href = nextStep.url;
        } else if (nextStep.type === "payment_init_failed") {
          setUnpaidOrder(nextStep.order);
        } else {
          router.push(`/track-order?order=${nextStep.orderId}`);
        }
      } catch (err) {
        if (isPriceChangedError(err)) {
          const updated = await refreshSession();
          const fee = paymentMethod === "cod" ? updated?.totals.cod_fee ?? 0 : 0;
          setActionError(
            updated
              ? `Le total de votre commande a changé : ${formatPrice(updated.totals.grand_total + fee)}. Vérifiez-le, puis confirmez à nouveau.`
              : "Le total de votre commande a changé. Rechargez la page pour voir le nouveau montant."
          );
        } else if (isConflictError(err)) {
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
  if (unpaidOrder) {
    return <PaymentInitFailedPanel order={unpaidOrder} />;
  }

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

      {/* Non-blocking address notice */}
      {addressNotice && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {addressNotice}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10">
        {/* ═══ Left Column ═══ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── 1. Shipping Address ──
              L'adresse vient EN PREMIER : elle conditionne les agences et les
              tarifs disponibles, et c'est l'ordre annoncé par le stepper
              (Panier → Adresse → Livraison → Paiement). */}
          <section aria-labelledby="address-title">
            <h2 id="address-title" className="sr-only">
              Adresse de livraison
            </h2>

            {hasAddress ? (
              <AddressPreview
                address={displayAddress!}
                onEdit={() => setIsAddressModalOpen(true)}
              />
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5 sm:p-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                    {addressesLoading ? (
                      <Loader2 size={24} className="text-amber-600 animate-spin" />
                    ) : (
                      <MapPin size={24} className="text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-1">
                      {addressesLoading
                        ? "Chargement de vos adresses…"
                        : "Adresse de livraison requise"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      {addressesLoading
                        ? "Nous récupérons vos adresses enregistrées."
                        : "Veuillez ajouter une adresse de livraison pour continuer votre commande."}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsAddressModalOpen(true)}
                    disabled={addressesLoading}
                    className="mt-1"
                  >
                    <Plus size={16} />
                    Ajouter une adresse
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* ── 1b. Delivery zone, when the address names none ── */}
          {hasAddress && session.shipping_address && !zoneId && zones.length > 0 && (
            <section
              aria-labelledby="zone-title"
              className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6"
            >
              <h2 id="zone-title" className="text-sm font-bold text-foreground mb-1">
                Zone de livraison
              </h2>
              <p className="text-xs text-muted-foreground mb-3">
                Indiquez la zone de votre adresse : les tarifs proposés sont ceux de cette zone.
              </p>
              <select
                aria-label="Zone de livraison"
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                defaultValue=""
                onChange={(e) => {
                  const zone = zones.find((z) => z.id === e.target.value);
                  if (zone) void handleSelectZone(zone);
                }}
              >
                <option value="" disabled>
                  Choisir une zone
                </option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </section>
          )}

          {zoneId && deliveryAgencies.length === 0 && (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
              role="status"
            >
              Aucune agence ne livre encore la zone de cette adresse. Choisissez une autre adresse.
            </div>
          )}

          {/* ── 2. Delivery Agency Preview ── */}
          <section aria-labelledby="agency-title">
            <h2 id="agency-title" className="sr-only">
              Agence de livraison
            </h2>
            <DeliveryAgencyPreview
              agency={selectedAgency}
              onEdit={() => setIsAgencyModalOpen(true)}
            />
          </section>

          {/* ── 3. Shipping Methods (shown after agency selection) ── */}
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

        </div>

        {/* ═══ Right Column — Order Summary ═══ */}
        <div className="lg:col-span-1">
          <CheckoutOrderSummary
            items={orderItems}
            subtotal={subtotal}
            shippingCost={shippingCost}
            discount={discount}
            total={total}
            codFee={codFee}
            couponCode={session.coupon_code ?? null}
            couponStatus={session.totals.coupon ?? null}
            paymentMethod={selectedPaymentMethod}
            onPaymentMethodChange={setSelectedPaymentMethod}
            shippingLabel={
              selectedMethod?.icon === "zap" ? "Express" : undefined
            }
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            groupBuyCode={session.group_buy_code ?? null}
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
        loading={addressesLoading}
      />
    </>
  );
}

export { CheckoutOrchestrator };
