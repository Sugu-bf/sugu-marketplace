/**
 * The site publishes one contact: the support address.
 */

import { describe, expect, test } from "vitest";
import { organizationJsonLd } from "../structured-data";

describe("organization structured data", () => {
  test("names support@sugu.pro and no other address", () => {
    const json = JSON.stringify(organizationJsonLd());
    expect(json).toContain("support@sugu.pro");
    expect(json).not.toContain("contact@sugu.pro");
  });
});
