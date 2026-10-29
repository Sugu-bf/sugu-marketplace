// @vitest-environment jsdom
/**
 * The actions of the tracking page on an order — confirm the products of a
 * COD Mixte order, start one of its payments — are the buyer's only (P0-9).
 * They go out with the session of the buyer (the Web BFF adds its token), to
 * the URL of this order built by the page, and a refusal is told in the
 * page's words: never the backend's, which can name an internal step.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/test/render";
import { API_BASE_URL } from "@/lib/api/config";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { TrackingOrderSummary } from "../components/TrackingOrderSummary";
import type { TrackedOrder } from "../models/order";

const ORDER = "01jkqz3m5baxnp9c7hd2fewyr4";
const ORDER_URL = `${API_BASE_URL}/api/v1/public/orders/${ORDER}`;

const COD_MIXTE: NonNullable<TrackedOrder["codMixte"]> = {
  isCodMixte: true,
  deliveryFeePaid: false,
  productFeePaid: false,
  deliveryFeeAmount: 1000,
  productFeeAmount: 10000,
  deliveryFeePaidAt: null,
  productFeePaidAt: null,
  vendorConfirmedAt: "2026-10-21T09:00:00Z",
  payDeliveryFeeUrl: `${ORDER_URL}/pay-delivery-fee`,
  payProductFeeUrl: null,
  shipmentId: null,
  agencyAccepted: true,
  currentStep: "awaiting_delivery_payment",
};

function summary(codMixte: Partial<NonNullable<TrackedOrder["codMixte"]>> = {}) {
  return (
    <TrackingOrderSummary
      orderId={ORDER}
      orderNumber="SGU-2026-00042"
      items={[]}
      subtotal={10000}
      shippingCost={1000}
      shippingLabel={null}
      discount={0}
      total={11000}
      paymentMethod="COD Mixte"
      paymentStatus="cod_pending"
      codMixte={{ ...COD_MIXTE, ...codMixte }}
    />
  );
}

const fetchMock = vi.fn();
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let location: { href: string };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  location = { href: "" };
  vi.spyOn(window, "location", "get").mockReturnValue(location as unknown as Location);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Tracking — paying the delivery fee of a COD Mixte order", () => {
  it("starts the payment of this order with the session of the buyer, then goes to it", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true, data: { payment_url: "https://pay.example.test/checkout/abc" } }));
    renderWithProviders(summary());

    fireEvent.click(screen.getByRole("button", { name: /Payer les frais de livraison/ }));

    await waitFor(() => expect(location.href).toBe("https://pay.example.test/checkout/abc"));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${ORDER_URL}/pay-delivery-fee`);
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
  });

  it("never posts to the URL the tracking payload carries", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true, data: { payment_url: "https://pay.example.test/checkout/abc" } }));
    renderWithProviders(summary({ payDeliveryFeeUrl: "https://psp.example.test/pay/xyz" }));

    fireEvent.click(screen.getByRole("button", { name: /Payer les frais de livraison/ }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe(`${ORDER_URL}/pay-delivery-fee`);
  });

  it("tells a refusal in its own words, not the backend's", async () => {
    fetchMock.mockResolvedValue(json(422, { success: false, message: "Paiement non disponible à cette étape (awaiting_pickup)." }));
    renderWithProviders(summary());

    fireEvent.click(screen.getByRole("button", { name: /Payer les frais de livraison/ }));

    expect(await screen.findByText(/Le paiement n'a pas pu être lancé/)).toBeInTheDocument();
    expect(screen.queryByText(/awaiting_pickup/)).toBeNull();
    expect(location.href).toBe("");
  });

  it("says when the network failed", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    renderWithProviders(summary());

    fireEvent.click(screen.getByRole("button", { name: /Payer les frais de livraison/ }));

    expect(await screen.findByText("Erreur réseau. Veuillez réessayer.")).toBeInTheDocument();
  });

  it("starts the payment of the products of this order", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true, data: { payment_url: "https://pay.example.test/checkout/def" } }));
    renderWithProviders(
      summary({
        currentStep: "awaiting_product_payment",
        deliveryFeePaid: true,
        payDeliveryFeeUrl: null,
        payProductFeeUrl: `${ORDER_URL}/pay-product-fee`,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /Payer les produits/ }));

    await waitFor(() => expect(location.href).toBe("https://pay.example.test/checkout/def"));
    expect(fetchMock.mock.calls[0][0]).toBe(`${ORDER_URL}/pay-product-fee`);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: "include" });
  });
});

describe("Tracking — confirming the products of a COD Mixte order", () => {
  const inspection = () =>
    summary({ currentStep: "awaiting_inspection", deliveryFeePaid: true, payDeliveryFeeUrl: null });

  it("confirms with the session of the buyer", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true }));
    renderWithProviders(inspection());

    fireEvent.click(screen.getByRole("button", { name: "J'ai bien reçu mes produits" }));

    expect(await screen.findByText(/Réception confirmée/)).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${ORDER_URL}/verify-products`);
    expect(init).toMatchObject({ method: "POST", credentials: "include", body: JSON.stringify({ accepted: true }) });
  });

  it("tells someone else's refusal in its own words", async () => {
    fetchMock.mockResolvedValue(json(404, { success: false, message: "Commande introuvable." }));
    renderWithProviders(inspection());

    fireEvent.click(screen.getByRole("button", { name: "J'ai bien reçu mes produits" }));

    expect(await screen.findByText(/Votre confirmation n'a pas pu être enregistrée/)).toBeInTheDocument();
  });
});

describe("Tracking — prepaying a COD classic order", () => {
  it("starts the payment of this order with the session of the buyer", async () => {
    fetchMock.mockResolvedValue(json(200, { success: true, data: { payment_url: "https://pay.example.test/checkout/ghi" } }));
    renderWithProviders(
      <TrackingOrderSummary
        orderId={ORDER}
        items={[]}
        subtotal={10000}
        shippingCost={1000}
        shippingLabel={null}
        discount={0}
        total={11000}
        paymentMethod="Cash (COD)"
        paymentStatus="cod_pending"
        codMixte={null}
        codFlowType="legacy"
        codPrepaid={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Payer la commande/ }));

    await waitFor(() => expect(location.href).toBe("https://pay.example.test/checkout/ghi"));
    expect(fetchMock.mock.calls[0][0]).toBe(`${ORDER_URL}/pay-order`);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST", credentials: "include" });
  });
});
