// @vitest-environment jsdom
/**
 * Payment result pages (P1-25): « Paiement confirmé » only for a payment the
 * API says succeeded, whichever return URL the provider used.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/test/render";
import { ApiError } from "@/lib/api/errors";
import type { PaymentStatus } from "../api/payment.schemas";

const { getPaymentStatus } = vi.hoisted(() => ({ getPaymentStatus: vi.fn() }));
vi.mock("../api/payment.api", () => ({ getPaymentStatus }));

import { PaymentResult } from "../components/PaymentResult";

const REF = "abc123";
const RETURN_TO = `/payments/success?ref=${REF}`;

function payment(status: PaymentStatus["status"]): PaymentStatus {
  return {
    order_id: "01jkqz3m5baxnp9c7hd2fewyr4",
    order_number: "SU-2026-000010",
    purpose: "checkout",
    status,
    terminal: status !== "processing",
    amount: 15000,
    currency: "XOF",
  };
}

function render(landing: "success" | "failed", paymentRef: string | null = REF) {
  renderWithProviders(<PaymentResult paymentRef={paymentRef} landing={landing} returnTo={RETURN_TO} />);
}

const CONFIRMED = "Paiement confirmé !";
const FAILED = "Paiement non abouti";
const CHECKING = "Paiement en cours de vérification";

beforeEach(() => {
  getPaymentStatus.mockReset();
});

describe("PaymentResult", () => {
  it.each(["success", "failed"] as const)("claims nothing while checking (%s page)", (landing) => {
    getPaymentStatus.mockReturnValue(new Promise(() => {}));
    render(landing);

    expect(screen.getByRole("heading", { name: CHECKING })).toBeInTheDocument();
    expect(screen.queryByText(CONFIRMED)).toBeNull();
    expect(screen.queryByText(FAILED)).toBeNull();
  });

  it.each(["success", "failed"] as const)("confirms a succeeded payment (%s page)", async (landing) => {
    getPaymentStatus.mockResolvedValue(payment("succeeded"));
    render(landing);

    expect(await screen.findByRole("heading", { name: CONFIRMED })).toBeInTheDocument();
    expect(screen.getByText(/SU-2026-000010/)).toBeInTheDocument();
    expect(screen.queryByText(FAILED)).toBeNull();
  });

  it.each(["success", "failed"] as const)("shows a failed payment as failed (%s page)", async (landing) => {
    getPaymentStatus.mockResolvedValue(payment("failed"));
    render(landing);

    expect(await screen.findByRole("heading", { name: FAILED })).toBeInTheDocument();
    expect(screen.queryByText(CONFIRMED)).toBeNull();
  });

  it("says a payment under review is checked by the team", async () => {
    getPaymentStatus.mockResolvedValue(payment("under_review"));
    render("success");

    expect(
      await screen.findByRole("heading", { name: "Paiement en cours de vérification par notre équipe" })
    ).toBeInTheDocument();
    expect(screen.queryByText(CONFIRMED)).toBeNull();
  });

  it("asks a buyer who is not logged in to log in, then come back", async () => {
    getPaymentStatus.mockRejectedValue(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "x" }));
    render("success");

    expect(await screen.findByRole("link", { name: /Se connecter/ })).toHaveAttribute(
      "href",
      `/login?redirect=${encodeURIComponent(RETURN_TO)}`
    );
  });

  it("stays neutral on the success page for an unknown ref", async () => {
    getPaymentStatus.mockRejectedValue(new ApiError({ status: 404, code: "NOT_FOUND", message: "x" }));
    render("success");

    expect(await screen.findByRole("heading", { name: "État du paiement indisponible" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voir mes commandes/ })).toHaveAttribute("href", "/account/orders");
    expect(screen.queryByText(CONFIRMED)).toBeNull();
  });

  it("keeps the failure message on the failed page without a ref", () => {
    render("failed", null);

    expect(screen.getByRole("heading", { name: FAILED })).toBeInTheDocument();
    expect(getPaymentStatus).not.toHaveBeenCalled();
  });

  it("stays neutral on the success page without a ref", () => {
    render("success", null);

    expect(screen.getByRole("heading", { name: "État du paiement indisponible" })).toBeInTheDocument();
    expect(getPaymentStatus).not.toHaveBeenCalled();
  });
});
