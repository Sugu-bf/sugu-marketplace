// @vitest-environment jsdom
/**
 * « Mes commandes » lists the purchases of the user, page by page, with a
 * label for every status of an order, and an « En livraison » filter that
 * finds the orders on their way. It showed the last 10 orders only, mixed
 * with the orders received by the user's stores, labelled « En attente »
 * whatever they had become, and the « En livraison » filter was always empty.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@/test/render";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock("@/lib/api", async () => ({
  ...(await vi.importActual<typeof import("@/lib/api")>("@/lib/api")),
  api: { get: getMock },
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import OrdersPage from "@/app/(main)/account/orders/page";
import { fetchOrders } from "../api/account.api";
import {
  ORDER_STATUS_FILTERS,
  orderStatusBadge,
  ordersPageHref,
  parseOrdersPage,
} from "../models/order-status";

const BACKEND_STATUSES = [
  ["pending", "En attente"],
  ["awaiting_payment", "En attente de paiement"],
  ["confirmed", "Confirmée"],
  ["processing", "En préparation"],
  ["packed", "Emballée"],
  ["shipped", "En livraison"],
  ["delivered", "Livrée"],
  ["canceled", "Annulée"],
  ["returned", "Retournée"],
  ["failed", "Échouée"],
] as const;

function order(id: string, statusCode: string, status = "Libellé du backend") {
  return {
    id,
    displayId: `#SGU-${id.slice(-4)}`,
    date: "21/10/2026",
    relativeDate: "il y a 2 jours",
    statusCode,
    status,
    totalAmount: 12000,
    currency: "XOF",
    itemCount: 1,
    items: [{ name: "Riz", quantity: 1, image: null }],
  };
}

function answer(orders: unknown[], pagination: Partial<Record<string, number | null>> = {}) {
  return {
    data: {
      success: true,
      data: {
        orders,
        pagination: { current_page: 1, last_page: 1, per_page: 10, total: orders.length, from: 1, to: orders.length, ...pagination },
      },
    },
  };
}

const askedUrl = () => new URL(getMock.mock.calls[0][0] as string);

beforeEach(() => {
  getMock.mockReset();
});

describe("status of an order", () => {
  it.each(BACKEND_STATUSES)("labels %s « %s »", (code, label) => {
    expect(orderStatusBadge(code).label).toBe(label);
  });

  it("keeps the backend label of a status it does not know", () => {
    expect(orderStatusBadge("on_hold", "En pause")).toEqual({ label: "En pause", variant: "secondary" });
  });

  it("filters « En livraison » on the orders on their way", () => {
    expect(ORDER_STATUS_FILTERS.find((f) => f.label === "En livraison")?.value).toBe("in_delivery");
  });
});

describe("pages of the list", () => {
  it.each([
    [undefined, 1],
    ["3", 3],
    ["0", 1],
    ["-2", 1],
    ["2abc", 1],
    ["99999999", 1],
  ])("reads page %s as %i", (value, page) => {
    expect(parseOrdersPage(value)).toBe(page);
  });

  it("keeps the filter in the address of a page", () => {
    expect(ordersPageHref("in_delivery", 2)).toBe("/account/orders?status=in_delivery&page=2");
    expect(ordersPageHref(undefined, 1)).toBe("/account/orders");
  });
});

describe("fetchOrders", () => {
  it("asks the purchases of the user only, for the page and filter given", async () => {
    getMock.mockResolvedValue(answer([]));

    await fetchOrders({ page: 3, status: "in_delivery" });

    const url = askedUrl();
    expect(url.pathname).toBe("/api/v1/orders");
    expect(url.searchParams.get("scope")).toBe("purchases");
    expect(url.searchParams.get("page")).toBe("3");
    expect(url.searchParams.get("status")).toBe("in_delivery");
  });
});

describe("« Mes commandes »", () => {
  const page = async (searchParams: { status?: string; page?: string }) =>
    render(await OrdersPage({ searchParams: Promise.resolve(searchParams) }));

  it("asks the page in the address, and pages through the list keeping the filter", async () => {
    getMock.mockResolvedValue(
      answer([order("01jkqz3m5baxnp9c7hd2fewy01", "shipped")], { current_page: 2, last_page: 3, total: 25 }),
    );

    await page({ status: "in_delivery", page: "2" });

    expect(askedUrl().searchParams.get("page")).toBe("2");
    const pager = screen.getByRole("navigation", { name: "Pages des commandes" });
    expect(within(pager).getByText("Page 2 sur 3")).toBeInTheDocument();
    expect(within(pager).getByRole("link", { name: /Précédente/ })).toHaveAttribute("href", "/account/orders?status=in_delivery");
    expect(within(pager).getByRole("link", { name: /Suivante/ })).toHaveAttribute(
      "href",
      "/account/orders?status=in_delivery&page=3",
    );
  });

  it("shows no pager when the list holds on one page", async () => {
    getMock.mockResolvedValue(answer([order("01jkqz3m5baxnp9c7hd2fewy01", "delivered")]));

    await page({});

    expect(screen.queryByRole("navigation", { name: "Pages des commandes" })).toBeNull();
  });

  it("labels each order with its own status", async () => {
    getMock.mockResolvedValue(
      answer([
        order("01jkqz3m5baxnp9c7hd2fewy01", "packed"),
        order("01jkqz3m5baxnp9c7hd2fewy02", "returned"),
        order("01jkqz3m5baxnp9c7hd2fewy03", "awaiting_payment"),
        order("01jkqz3m5baxnp9c7hd2fewy04", "failed"),
      ]),
    );

    await page({});

    for (const label of ["Emballée", "Retournée", "En attente de paiement", "Échouée"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
