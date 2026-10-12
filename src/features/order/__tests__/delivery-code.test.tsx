// @vitest-environment jsdom
/**
 * Code de confirmation de livraison — V4.1.
 *
 * Le client lit son code sur l'écran de suivi et le donne au livreur. Le
 * serveur décide s'il peut être lu : l'écran n'invente jamais de code, dit
 * pourquoi il n'y en a pas, distingue une panne d'une attente, et ne garde
 * pas un code d'un état passé.
 */
import { beforeEach, describe, expect, test, vi } from "vitest";
import { focusManager } from "@tanstack/react-query";
import { renderWithProviders, screen, waitFor, fireEvent, act } from "@/test/render";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("@/lib/api", async () => {
  const errors = await vi.importActual<typeof import("@/lib/api/errors")>("@/lib/api/errors");
  return {
    api: { get: getMock },
    v1Url: (path: string) => `/api/v1/${path}`,
    isApiError: errors.isApiError,
    ApiError: errors.ApiError,
  };
});

import { ApiError } from "@/lib/api/errors";
import { DeliveryCodeCard } from "../components/DeliveryCodeCard";
import { MAX_VERIFIED_AGE } from "../hooks/useDeliveryCode";
import { queryDeliveryCode } from "../queries/order-queries";
import { isDeliveryCodeSettled, mapDeliveryCodeEntry } from "../models/delivery-code";

const ORDER = "01JKQZ3M5BAXNP9C7HD2FEWYR4";
const CODE = "QX7K29MD";

const entry = (state: string, code: string | null, message: string, shipment = "01JKQZ3M5BAXNP9C7HD2FEWYS1") => ({
  shipment_id: shipment,
  state,
  code,
  message,
});

const answer = (...deliveries: ReturnType<typeof entry>[]) => ({
  data: { success: true as const, data: { order_id: ORDER, deliveries } },
});

const AVAILABLE = entry("available", CODE, "Donnez ce code au livreur au moment de la remise, une fois le colis vérifié.");
const PAYMENT = entry("product_payment_pending", null, "Votre code s'affichera ici une fois les produits payés.");
const WAITING = entry("not_on_the_way", null, "Votre code s'affichera ici dès que le livreur sera en route vers vous.");
const DELIVERED = entry("delivered", null, "Votre commande a été remise : le code n'est plus nécessaire.");

const networkError = () => new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Network" });
const refused = (status: number) =>
  new ApiError({ status, code: status === 401 ? "UNAUTHORIZED" : "NOT_FOUND", message: "Refusé" });

const card = (signal = "shipping") => <DeliveryCodeCard orderId={ORDER} signal={signal} />;
const UNVERIFIED = /L'état de votre code ne peut pas être vérifié pour le moment : il reste masqué/;
/** The customer comes back to the tab: the code is checked again. */
const comeBack = () =>
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });
const shownCode = () => screen.queryByTestId("delivery-code");

beforeEach(() => {
  getMock.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});

// ─── Contract ─────────────────────────────────────────────────

describe("delivery code contract", () => {
  test("asks the route of the order, never kept by a cache, with no code in the address", async () => {
    getMock.mockResolvedValue(answer(AVAILABLE));

    await expect(queryDeliveryCode(ORDER)).resolves.toEqual([
      { shipmentId: AVAILABLE.shipment_id, state: "available", code: CODE, message: AVAILABLE.message },
    ]);

    expect(getMock).toHaveBeenCalledTimes(1);
    const [url, options] = getMock.mock.calls[0];
    expect(url).toBe(`/api/v1/orders/${ORDER}/delivery-code`);
    expect(options).toMatchObject({ cache: "no-store", revalidate: false });
    // The session cookie identifies the customer: credentials are sent.
    expect(options).not.toHaveProperty("skipCredentials");
  });

  test("shows a code only when the server says it can be read", () => {
    expect(mapDeliveryCodeEntry(entry("product_payment_pending", CODE, "x")).code).toBeNull();
    expect(mapDeliveryCodeEntry(entry("delivered", CODE, "x")).code).toBeNull();
    expect(mapDeliveryCodeEntry(entry("available", "  ", "x")).code).toBeNull();
    expect(mapDeliveryCodeEntry(entry("available", CODE, "x")).code).toBe(CODE);
  });

  test("keeps a state it does not know readable, without a code", () => {
    expect(mapDeliveryCodeEntry(entry("held_by_customs", CODE, "En attente."))).toMatchObject({
      state: "unknown",
      code: null,
      message: "En attente.",
    });
  });

  test("stops asking once every delivery is done", () => {
    const of = (...states: string[]) => states.map((s) => mapDeliveryCodeEntry(entry(s, null, "x")));

    expect(isDeliveryCodeSettled(of("delivered"))).toBe(true);
    expect(isDeliveryCodeSettled(of("delivered", "order_closed"))).toBe(true);
    expect(isDeliveryCodeSettled(of("delivered", "not_on_the_way"))).toBe(false);
    expect(isDeliveryCodeSettled(of("failed"))).toBe(false);
    expect(isDeliveryCodeSettled([])).toBe(false);
  });
});

// ─── Screen ───────────────────────────────────────────────────

describe("DeliveryCodeCard", () => {
  test("shows the code and what to do with it", async () => {
    getMock.mockResolvedValue(answer(AVAILABLE));
    renderWithProviders(card());

    expect(screen.getByRole("heading", { name: "Code de confirmation de livraison" })).toBeInTheDocument();
    expect(screen.getByText("Chargement de votre code…")).toBeInTheDocument();
    expect(shownCode()).toBeNull();

    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));
    expect(screen.getByText(AVAILABLE.message)).toBeInTheDocument();
    // Read out letter by letter, not as a word.
    expect(shownCode()).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Votre code : Q X 7 K 2 9 M D")).toHaveClass("sr-only");
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "false");
  });

  test("says the goods must be paid first, and shows no code", async () => {
    getMock.mockResolvedValue(answer(PAYMENT));
    renderWithProviders(card("awaiting_product_payment"));

    expect(await screen.findByText(PAYMENT.message)).toBeInTheDocument();
    expect(shownCode()).toBeNull();
    expect(screen.queryByRole("button", { name: "Réessayer" })).toBeNull();
  });

  test("never shows a code the server sent with a state that forbids it", async () => {
    getMock.mockResolvedValue(answer(entry("product_payment_pending", CODE, PAYMENT.message)));
    const { container } = renderWithProviders(card());

    expect(await screen.findByText(PAYMENT.message)).toBeInTheDocument();
    expect(container.textContent).not.toContain(CODE);
  });

  test("tells a failure of the network apart from a wait, and tries again", async () => {
    getMock.mockRejectedValueOnce(networkError()).mockRejectedValueOnce(networkError());
    renderWithProviders(card());

    expect(
      // A cut is tried once more before it is announced.
      await screen.findByText(UNVERIFIED, undefined, { timeout: 5_000 })
    ).toBeInTheDocument();
    expect(getMock).toHaveBeenCalledTimes(2);
    expect(shownCode()).toBeNull();
    expect(screen.queryByText(PAYMENT.message)).toBeNull();

    getMock.mockResolvedValue(answer(AVAILABLE));
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));
    expect(screen.queryByRole("button", { name: "Réessayer" })).toBeNull();
  });

  // ─── A code that can no longer be confirmed is no longer shown (V4.2) ───

  test("hides a code it was showing as soon as checking it again fails", async () => {
    getMock.mockResolvedValueOnce(answer(AVAILABLE));
    const view = renderWithProviders(card());
    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));

    // The network drops: the check and its one retry both fail.
    getMock.mockRejectedValue(networkError());
    comeBack();

    expect(await screen.findByText(UNVERIFIED, undefined, { timeout: 5_000 })).toBeInTheDocument();
    expect(shownCode()).toBeNull();
    expect(view.container.textContent).not.toContain(CODE);
    // Nor what to do with it: nothing read before is presented as true.
    expect(screen.queryByText(AVAILABLE.message)).toBeNull();
    expect(screen.getByRole("button", { name: "Réessayer" })).toBeEnabled();
  });

  test("keeps the code hidden while it tries again, and shows it once the server confirms it", async () => {
    getMock.mockResolvedValueOnce(answer(AVAILABLE));
    const view = renderWithProviders(card());
    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));

    getMock.mockRejectedValue(networkError());
    comeBack();
    await screen.findByText(UNVERIFIED, undefined, { timeout: 5_000 });

    let release: (value: unknown) => void = () => {};
    getMock.mockReset();
    getMock.mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));

    // The new answer is on its way: still no code.
    await waitFor(() => expect(screen.getByRole("button", { name: "Nouvel essai…" })).toBeDisabled());
    expect(view.container.textContent).not.toContain(CODE);

    await act(async () => release(answer(AVAILABLE)));
    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));
    expect(screen.queryByText(UNVERIFIED)).toBeNull();
  });

  test("hides the code when the server fails, as when the network does", async () => {
    getMock.mockResolvedValueOnce(answer(AVAILABLE));
    const view = renderWithProviders(card());
    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));

    getMock.mockRejectedValue(new ApiError({ status: 503, code: "SERVER_ERROR", message: "Indisponible" }));
    comeBack();

    expect(await screen.findByText(UNVERIFIED, undefined, { timeout: 5_000 })).toBeInTheDocument();
    expect(view.container.textContent).not.toContain(CODE);
  });

  test("does not hide the code for one request that fails and passes at its retry", async () => {
    getMock.mockResolvedValueOnce(answer(AVAILABLE));
    renderWithProviders(card());
    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));

    // An unstable network: one failure, then the answer.
    getMock.mockRejectedValueOnce(networkError()).mockResolvedValue(answer(AVAILABLE));
    comeBack();

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(3), { timeout: 5_000 });
    expect(shownCode()).toHaveTextContent(CODE);
    expect(screen.queryByText(UNVERIFIED)).toBeNull();
  });

  test("removes the code when the check says the session is gone", async () => {
    getMock.mockResolvedValueOnce(answer(AVAILABLE));
    const view = renderWithProviders(card());
    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));

    getMock.mockRejectedValue(refused(401));
    comeBack();

    expect(await screen.findByText(/Connectez-vous avec le compte qui a passé la commande/)).toBeInTheDocument();
    expect(view.container.textContent).not.toContain(CODE);
  });

  test("no longer shows an answer too old to prove anything, and asks again", async () => {
    getMock.mockResolvedValueOnce(answer(AVAILABLE));
    const view = renderWithProviders(card());
    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));
    expect(getMock).toHaveBeenCalledTimes(1);

    // The phone slept: no check ran, and the answer is now older than two of them.
    let release: (value: unknown) => void = () => {};
    getMock.mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
    const later = Date.now() + MAX_VERIFIED_AGE + 1_000;
    const clock = vi.spyOn(Date, "now").mockReturnValue(later);
    try {
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      await waitFor(() => expect(shownCode()).toBeNull());
      expect(view.container.textContent).not.toContain(CODE);
      expect(screen.getByText("Chargement de votre code…")).toBeInTheDocument();
      await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));

      await act(async () => release(answer(AVAILABLE)));
      await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));
    } finally {
      clock.mockRestore();
    }
  });

  test("keeps saying a delivery is done however old the answer: nothing can change any more", async () => {
    getMock.mockResolvedValueOnce(answer(DELIVERED));
    renderWithProviders(card("delivered"));
    expect(await screen.findByText(DELIVERED.message)).toBeInTheDocument();

    const clock = vi.spyOn(Date, "now").mockReturnValue(Date.now() + 10 * MAX_VERIFIED_AGE);
    try {
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      expect(screen.getByText(DELIVERED.message)).toBeInTheDocument();
      expect(getMock).toHaveBeenCalledTimes(1);
    } finally {
      clock.mockRestore();
    }
  });

  test("shows the code as soon as the payment is known, and not the wait any more", async () => {
    getMock.mockResolvedValueOnce(answer(PAYMENT));
    const view = renderWithProviders(card("shipping|partial|4||awaiting_product_payment|"));
    expect(await screen.findByText(PAYMENT.message)).toBeInTheDocument();

    getMock.mockResolvedValueOnce(answer(AVAILABLE));
    view.rerender(card("shipping|paid|5||awaiting_code|paid"));

    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));
    expect(screen.queryByText(PAYMENT.message)).toBeNull();
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  test("drops the code as soon as the order changes, before the new answer", async () => {
    getMock.mockResolvedValueOnce(answer(AVAILABLE));
    const view = renderWithProviders(card("shipping"));
    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));

    let release: (value: unknown) => void = () => {};
    getMock.mockReturnValueOnce(new Promise((resolve) => (release = resolve)));
    view.rerender(card("delivered"));

    // The old code is gone while the new answer is awaited.
    await waitFor(() => expect(shownCode()).toBeNull());
    expect(view.container.textContent).not.toContain(CODE);

    release(answer(DELIVERED));
    expect(await screen.findByText(DELIVERED.message)).toBeInTheDocument();
    expect(view.container.textContent).not.toContain(CODE);
  });

  test("says when the code is not shown yet", async () => {
    getMock.mockResolvedValue(answer(WAITING));
    renderWithProviders(card("preparing"));

    expect(await screen.findByText(WAITING.message)).toBeInTheDocument();
    expect(shownCode()).toBeNull();
  });

  test("asks to sign in when nobody is signed in, and shows nothing of the order", async () => {
    getMock.mockRejectedValue(refused(401));
    renderWithProviders(card());

    expect(
      await screen.findByText(/Connectez-vous avec le compte qui a passé la commande/)
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Se connecter" })).toHaveAttribute("href", "/login");
    expect(shownCode()).toBeNull();
    // A refusal is not played again.
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  test("says the code belongs to the account that ordered", async () => {
    getMock.mockRejectedValue(refused(404));
    renderWithProviders(card());

    expect(
      await screen.findByText("Ce code n'est lisible que par le compte qui a passé la commande.")
    ).toBeInTheDocument();
    expect(shownCode()).toBeNull();
    expect(screen.queryByRole("button", { name: "Réessayer" })).toBeNull();
  });

  test("shows nothing for an order that is closed or has no delivery", async () => {
    getMock.mockResolvedValue(answer(entry("order_closed", null, "Cette commande est clôturée.")));
    const closed = renderWithProviders(card("cancelled"));
    await waitFor(() => expect(closed.container).toBeEmptyDOMElement());
    closed.unmount();

    getMock.mockResolvedValue(answer());
    const none = renderWithProviders(card("confirmed"));
    await waitFor(() => expect(none.container).toBeEmptyDOMElement());
  });

  test("names each delivery of an order that has several", async () => {
    getMock.mockResolvedValue(answer(AVAILABLE, { ...WAITING, shipment_id: "01JKQZ3M5BAXNP9C7HD2FEWYS2" }));
    renderWithProviders(card());

    expect(await screen.findByText("Livraison 1 sur 2")).toBeInTheDocument();
    expect(screen.getByText("Livraison 2 sur 2")).toBeInTheDocument();
    expect(screen.getAllByTestId("delivery-code")).toHaveLength(1);
    expect(screen.getByText(WAITING.message)).toBeInTheDocument();
  });

  test("keeps the code out of the address and of the storage of the browser", async () => {
    getMock.mockResolvedValue(answer(AVAILABLE));
    renderWithProviders(card());
    await waitFor(() => expect(shownCode()).toHaveTextContent(CODE));

    expect(window.location.href).not.toContain(CODE);
    expect(JSON.stringify({ ...localStorage })).not.toContain(CODE);
    expect(JSON.stringify({ ...sessionStorage })).not.toContain(CODE);
    expect(document.cookie).not.toContain(CODE);
    expect(JSON.stringify(getMock.mock.calls)).not.toContain(CODE);
  });
});
