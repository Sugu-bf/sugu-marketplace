// @vitest-environment jsdom
/**
 * The tracking page leaves the site for a payment only when the API hands
 * back a trusted provider URL (P1-24): any other URL is reported as a failed
 * payment initiation and the buyer stays on the page.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@/test/render";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { TrackingOrderSummary } from "../components/TrackingOrderSummary";
import type { TrackedOrder } from "../models/order";

const ORDER = "01jkqz3m5baxnp9c7hd2fewyr4";

const AWAITING_DELIVERY_PAYMENT: NonNullable<TrackedOrder["codMixte"]> = {
  isCodMixte: true,
  deliveryFeePaid: false,
  productFeePaid: false,
  deliveryFeeAmount: 1000,
  productFeeAmount: 10000,
  deliveryFeePaidAt: null,
  productFeePaidAt: null,
  vendorConfirmedAt: "2026-10-21T09:00:00Z",
  payDeliveryFeeUrl: `https://api.mysugu.com/api/v1/public/orders/${ORDER}/pay-delivery-fee`,
  payProductFeeUrl: null,
  shipmentId: null,
  agencyAccepted: true,
  currentStep: "awaiting_delivery_payment",
};

function renderSummary() {
  renderWithProviders(
    <TrackingOrderSummary
      orderId={ORDER}
      orderNumber="SGU-2026-00042"
      items={[]}
      stores={[]}
      subtotal={10000}
      shippingCost={1000}
      shippingLabel={null}
      discount={0}
      total={11000}
      paymentMethod="Paiement à la livraison"
      paymentStatus="unpaid"
      codMixte={AWAITING_DELIVERY_PAYMENT}
    />
  );
}

function answer(body: unknown) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })));
}

const GENERIC_ERROR = "Le paiement n'a pas pu être lancé. Réessayez dans un instant ou contactez le support.";

const payButton = () => screen.getByRole("button", { name: /Payer les frais de livraison/ });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Tracking — payment redirect", () => {
  it.each([
    "https://app.ligdicash.com.evil.tld/checkout",
    "javascript:alert(1)",
    "http://app.ligdicash.com/checkout",
  ])("refuses to leave for an untrusted payment URL (%s)", async (paymentUrl) => {
    answer({ success: true, message: "Paiement initié", data: { payment_url: paymentUrl } });
    renderSummary();

    fireEvent.click(payButton());

    expect(await screen.findByText(GENERIC_ERROR)).toBeInTheDocument();
    expect(payButton()).not.toBeDisabled();
  });

  it("reports a missing payment URL as a failed initiation", async () => {
    answer({ success: true, message: "Paiement initié", data: { payment_url: null } });
    renderSummary();

    fireEvent.click(payButton());

    expect(await screen.findByText(GENERIC_ERROR)).toBeInTheDocument();
  });

  it("shows a generic message when the initiation is refused, never the step it was refused at", async () => {
    answer({ success: false, message: "Frais de livraison déjà payés." });
    renderSummary();

    fireEvent.click(payButton());

    expect(await screen.findByText(GENERIC_ERROR)).toBeInTheDocument();
    expect(screen.queryByText("Frais de livraison déjà payés.")).not.toBeInTheDocument();
  });

  it("follows a trusted provider URL", async () => {
    answer({ success: true, data: { payment_url: "https://app.ligdicash.com/pay/v01/redirect/x" } });
    renderSummary();

    fireEvent.click(payButton());

    expect(await screen.findByRole("button", { name: /Redirection/ })).toBeDisabled();
    expect(screen.queryByText("Erreur lors de l'initiation du paiement.")).toBeNull();
  });
});
