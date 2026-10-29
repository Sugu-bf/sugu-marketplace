import { beforeEach, describe, expect, test, vi } from "vitest";

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: { get: getMock, post: postMock },
  v1Url: (path: string) => `/api/v1/${path}`,
  publicUrl: (path: string) => `/api/v1/public/${path}`,
}));

import { confirmOrderProducts, queryTrackedOrderRaw, startOrderPayment } from "../queries/order-queries";

describe("order tracking queries", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  test("uses the authenticated endpoint shared by Web and mobile", async () => {
    const order = { id: "01JKQZ3M5BAXNP9C7HD2FEWYR4" };
    getMock.mockResolvedValue({
      data: { success: true, data: { order } },
    });

    await expect(queryTrackedOrderRaw(order.id)).resolves.toBe(order);

    expect(getMock).toHaveBeenCalledWith(
      `/api/v1/orders/${order.id}/status`,
      expect.objectContaining({ timeout: 6_000 }),
    );
    expect(getMock.mock.calls[0][1]).not.toHaveProperty("skipCredentials");
  });
});

describe("order actions of the buyer (P0-9)", () => {
  const ORDER = "01JKQZ3M5BAXNP9C7HD2FEWYR4";

  beforeEach(() => {
    postMock.mockReset();
  });

  test.each(["pay-delivery-fee", "pay-product-fee", "pay-order"] as const)(
    "starts %s of the order with the session of the buyer",
    async (action) => {
      const body = { success: true, data: { payment_url: "https://pay.example.test/x" } };
      postMock.mockResolvedValue({ data: body });

      await expect(startOrderPayment(ORDER, action)).resolves.toBe(body);

      expect(postMock).toHaveBeenCalledWith(`/api/v1/public/orders/${ORDER}/${action}`);
    },
  );

  test("confirms the products with the session of the buyer", async () => {
    postMock.mockResolvedValue({ data: { success: true } });

    await confirmOrderProducts(ORDER);

    expect(postMock).toHaveBeenCalledWith(`/api/v1/public/orders/${ORDER}/verify-products`, {
      body: { accepted: true },
    });
    expect(postMock.mock.calls[0][1]).not.toHaveProperty("skipCredentials");
  });
});
