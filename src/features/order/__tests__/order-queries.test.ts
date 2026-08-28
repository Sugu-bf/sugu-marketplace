import { beforeEach, describe, expect, test, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: { get: getMock },
  v1Url: (path: string) => `/api/v1/${path}`,
}));

import { queryTrackedOrderRaw } from "../queries/order-queries";

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
