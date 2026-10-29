/**
 * « Acheter maintenant » never buys the rest of the cart in silence: with
 * other lines in the cart, the buyer reviews it before paying.
 */

import { describe, expect, test } from "vitest";
import { buyNowNeedsCartReview } from "../utils/product-availability";

describe("buy now", () => {
  test("goes straight to the checkout when the article is the whole cart", () => {
    expect(buyNowNeedsCartReview(1)).toBe(false);
  });

  test("sends the buyer to the cart when it holds other articles", () => {
    expect(buyNowNeedsCartReview(2)).toBe(true);
  });
});
