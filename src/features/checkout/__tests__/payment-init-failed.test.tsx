// @vitest-environment jsdom
/**
 * An online order whose payment could not start (P1-24) is shown as unpaid,
 * with « Réessayer le paiement »: the retry follows only a trusted provider
 * URL, keeps the button on a transient failure and explains why when the
 * order can no longer be paid.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@/test/render";
import { ApiError } from "@/lib/api/errors";

const { retryOrderPayment } = vi.hoisted(() => ({ retryOrderPayment: vi.fn() }));
vi.mock("@/features/payment/api/payment.api", () => ({ retryOrderPayment }));

import { PaymentInitFailedPanel } from "../components/PaymentInitFailedPanel";

const ORDER = { id: "01jkqz3m5baxnp9c7hd2fewyr4", number: "SU-2026-000010", guestOrderToken: "gt_abc123" };

const retryButton = () => screen.getByRole("button", { name: "Réessayer le paiement" });

function apiError(status: number, errorCode?: string) {
  return new ApiError({
    status,
    code: status === 409 ? "CONFLICT" : "SERVER_ERROR",
    message: "upstream",
    details: errorCode ? { error_code: errorCode } : undefined,
  });
}

beforeEach(() => {
  retryOrderPayment.mockReset();
});

describe("PaymentInitFailedPanel", () => {
  it("says the order exists but is not paid", () => {
    renderWithProviders(<PaymentInitFailedPanel order={ORDER} />);

    expect(screen.getByText("Le paiement n'a pas pu être lancé")).toBeInTheDocument();
    expect(screen.getByText(/SU-2026-000010/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Voir la commande/ })).toHaveAttribute(
      "href",
      `/track-order?order=${ORDER.id}`
    );
  });

  it("retries with the guest order token and follows a trusted provider URL", async () => {
    retryOrderPayment.mockResolvedValue({
      order_id: ORDER.id,
      payment_url: "https://app.ligdicash.com/pay/v01/redirect/x",
      next_step: "redirect_to_payment",
    });
    renderWithProviders(<PaymentInitFailedPanel order={ORDER} />);

    fireEvent.click(retryButton());

    expect(await screen.findByRole("button", { name: /Redirection/ })).toBeDisabled();
    expect(retryOrderPayment).toHaveBeenCalledWith(ORDER.id, "gt_abc123");
  });

  it("does not follow an untrusted URL and keeps the retry", async () => {
    retryOrderPayment.mockResolvedValue({
      order_id: ORDER.id,
      payment_url: "https://app.ligdicash.com.evil.tld/pay",
      next_step: "redirect_to_payment",
    });
    renderWithProviders(<PaymentInitFailedPanel order={ORDER} />);

    fireEvent.click(retryButton());

    expect(await screen.findByText(/n'a toujours pas pu être lancé/)).toBeInTheDocument();
    expect(retryButton()).not.toBeDisabled();
  });

  it("keeps the retry when the provider is momentarily down (502)", async () => {
    retryOrderPayment.mockRejectedValue(apiError(502, "PAYMENT_INIT_FAILED"));
    renderWithProviders(<PaymentInitFailedPanel order={ORDER} />);

    fireEvent.click(retryButton());

    expect(await screen.findByText(/n'a toujours pas pu être lancé/)).toBeInTheDocument();
    expect(retryButton()).toBeInTheDocument();
  });

  it.each([
    ["ORDER_NOT_PAYABLE", /ne peut plus être payée en ligne/],
    ["OUT_OF_STOCK", /ne sont plus en stock/],
  ])("explains a %s refusal, drops the retry and points to the order", async (code, message) => {
    retryOrderPayment.mockRejectedValue(apiError(409, code));
    renderWithProviders(<PaymentInitFailedPanel order={ORDER} />);

    fireEvent.click(retryButton());

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Réessayer le paiement" })).toBeNull();
    expect(screen.getByRole("link", { name: /Voir la commande/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mes commandes" })).toHaveAttribute("href", "/account/orders");
  });
});
