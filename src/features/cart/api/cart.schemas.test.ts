import { describe, expect, it } from "vitest";
import { CartMetaSchema } from "./cart.schemas";

describe("CartMetaSchema", () => {
  it("accepts the transient anonymous cart returned before the first mutation", () => {
    const result = CartMetaSchema.safeParse({
      cart_id: null,
      currency: "XOF",
      cart_token: null,
    });

    expect(result.success).toBe(true);
  });
});
