// @vitest-environment jsdom
/**
 * The order tracking page lets the buyer reach someone about the order:
 * « Contacter le support » opens the live support chat of the page with the
 * order as subject, « Besoin d'aide ? » leads to the help centre, and each
 * store of the order gets « Contacter le vendeur », which opens the
 * conversation about this order with that store.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, fireEvent, waitFor } from "@/test/render";
import { ApiError } from "@/lib/api/errors";

const { push, startConversation } = vi.hoisted(() => ({ push: vi.fn(), startConversation: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/features/messaging/api", async () => ({
  ...(await vi.importActual<typeof import("@/features/messaging/api")>("@/features/messaging/api")),
  startConversation,
}));

import { TrackingOrderSummary } from "../components/TrackingOrderSummary";
import { useSupportChatLauncher } from "@/features/support-chat/launcher";
import { useToast } from "@/features/toast/toast-store";
import type { OrderStore, TrackedOrder } from "../models/order";

const ORDER = "01jkqz3m5baxnp9c7hd2fewyr4";
const STORE_A: OrderStore = { id: "01jkqz3m5baxnp9c7hd2fewst1", name: "Boutique Awa" };
const STORE_B: OrderStore = { id: "01jkqz3m5baxnp9c7hd2fewst2", name: "Marché Kalam" };

const AWAITING_INSPECTION: NonNullable<TrackedOrder["codMixte"]> = {
  isCodMixte: true,
  deliveryFeePaid: true,
  productFeePaid: false,
  deliveryFeeAmount: 1000,
  productFeeAmount: 10000,
  deliveryFeePaidAt: "2026-10-21T10:00:00Z",
  productFeePaidAt: null,
  vendorConfirmedAt: "2026-10-21T09:00:00Z",
  payDeliveryFeeUrl: null,
  payProductFeeUrl: null,
  shipmentId: null,
  agencyAccepted: true,
  currentStep: "awaiting_inspection",
};

function summary(stores: OrderStore[] = [], codMixte: TrackedOrder["codMixte"] = null) {
  return (
    <TrackingOrderSummary
      orderId={ORDER}
      orderNumber="SGU-2026-00042"
      items={[]}
      stores={stores}
      subtotal={10000}
      shippingCost={1000}
      shippingLabel={null}
      discount={0}
      total={11000}
      paymentMethod="Mobile Money"
      paymentStatus="paid"
      codMixte={codMixte}
    />
  );
}

let unregisterWidget: (() => void) | null = null;
/** As when the tracking page renders <SupportChatWidget />. */
const withWidget = () => {
  unregisterWidget = useSupportChatLauncher.getState().register();
};

beforeEach(() => {
  push.mockReset();
  startConversation.mockReset();
  unregisterWidget?.();
  unregisterWidget = null;
  useSupportChatLauncher.setState({ isOpen: false, suggestedSubject: null, suggestedOrderId: null, widgets: 0 });
});

describe("Tracking — support", () => {
  it("opens the live support chat about the order", () => {
    withWidget();
    renderWithProviders(summary());

    fireEvent.click(screen.getByRole("button", { name: /Contacter le support/ }));

    expect(useSupportChatLauncher.getState()).toMatchObject({
      isOpen: true,
      suggestedSubject: "Commande #SGU-2026-00042",
      suggestedOrderId: ORDER,
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("goes to the chat page when this page has no chat widget", () => {
    renderWithProviders(summary());

    fireEvent.click(screen.getByRole("button", { name: /Contacter le support/ }));

    expect(push).toHaveBeenCalledWith("/support-chat");
    expect(useSupportChatLauncher.getState().isOpen).toBe(false);
  });

  it("opens the chat about the order from the COD inspection too", () => {
    withWidget();
    renderWithProviders(summary([], AWAITING_INSPECTION));

    fireEvent.click(screen.getByRole("button", { name: "Un problème avec ma commande ? Contactez le support" }));

    expect(useSupportChatLauncher.getState()).toMatchObject({ isOpen: true, suggestedOrderId: ORDER });
    expect(screen.queryByRole("link", { name: /Un problème avec ma commande/ })).toBeNull();
  });

  it("leads « Besoin d'aide ? » to the help centre", () => {
    renderWithProviders(summary());

    expect(screen.getByRole("link", { name: "Besoin d'aide ?" })).toHaveAttribute("href", "/help");
  });
});

describe("Tracking — contact the seller about the order", () => {
  it("offers nothing when the stores of the order are not known", () => {
    renderWithProviders(summary([]));

    expect(screen.queryByRole("button", { name: /Contacter le vendeur/ })).toBeNull();
  });

  it("opens the conversation about this order with the store", async () => {
    startConversation.mockResolvedValue({ id: "01jkqz3m5baxnp9c7hd2fewyc1" });
    renderWithProviders(summary([STORE_A]));

    fireEvent.click(screen.getByRole("button", { name: "Contacter le vendeur" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/messages/01jkqz3m5baxnp9c7hd2fewyc1"));
    expect(startConversation).toHaveBeenCalledWith(STORE_A.id, ORDER, "order_support", undefined);
  });

  it("names each store of an order bought from several", async () => {
    startConversation.mockResolvedValue({ id: "01jkqz3m5baxnp9c7hd2fewyc2" });
    renderWithProviders(summary([STORE_A, STORE_B]));

    expect(screen.getByRole("button", { name: "Contacter Boutique Awa" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Contacter Marché Kalam" }));

    await waitFor(() => expect(startConversation).toHaveBeenCalledWith(STORE_B.id, ORDER, "order_support", undefined));
  });

  it("sends a signed-out buyer to sign in, then back to the order", async () => {
    startConversation.mockRejectedValue(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Non authentifié." }));
    renderWithProviders(summary([STORE_A]));

    fireEvent.click(screen.getByRole("button", { name: "Contacter le vendeur" }));

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith(`/login?redirect=${encodeURIComponent(`/track-order?id=${ORDER}`)}`),
    );
  });

  it("says why when the server refuses, and stays on the order", async () => {
    useToast.setState({ toasts: [] });
    startConversation.mockRejectedValue(
      new ApiError({ status: 422, code: "VALIDATION_ERROR", message: "Cette boutique ne fait pas partie de la commande." }),
    );
    renderWithProviders(summary([STORE_A]));

    fireEvent.click(screen.getByRole("button", { name: "Contacter le vendeur" }));

    await waitFor(() =>
      expect(useToast.getState().toasts).toEqual([
        expect.objectContaining({ type: "error", message: "Cette boutique ne fait pas partie de la commande." }),
      ]),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("says it in our words when the network or the server fails", async () => {
    useToast.setState({ toasts: [] });
    startConversation.mockRejectedValue(new ApiError({ status: 500, code: "SERVER_ERROR", message: "Server Error" }));
    renderWithProviders(summary([STORE_A]));

    fireEvent.click(screen.getByRole("button", { name: "Contacter le vendeur" }));

    await waitFor(() =>
      expect(useToast.getState().toasts).toEqual([
        expect.objectContaining({ type: "error", message: "La conversation n'a pas pu s'ouvrir. Réessayez." }),
      ]),
    );
    expect(push).not.toHaveBeenCalled();
  });
});
