// @vitest-environment jsdom
/**
 * P0-17 (audit 2026-10-29): the footer of every page, the account FAQ, the
 * account page and the branding fallback still gave a phone number
 * (+226 64 52 89 58), contact@sugu.pro and a "Support 24/7" promise, against
 * the contact policy of 2fd0860: one public address, support@sugu.pro.
 */
import { describe, expect, it } from "vitest";
import { render } from "@/test/render";
import Footer from "@/components/Footer";
import { queryFaqItems } from "@/features/account/queries/account-queries";
import { BRANDING_FALLBACK } from "@/lib/branding.service";
import { CONTACT } from "@/lib/constants";
import { organizationJsonLd } from "@/lib/seo/structured-data";

const INVENTED = [/\+226/, /contact@sugu\.pro/, /24\s?\/\s?7/, /Visa|Mastercard/];

function expectOnlySupportAddress(text: string) {
  for (const pattern of INVENTED) {
    expect(text).not.toMatch(pattern);
  }
}

describe("contact policy", () => {
  it("gives the support address, and nothing else, in the footer", () => {
    const { container } = render(<Footer />);

    expectOnlySupportAddress(container.textContent ?? "");
    expect(container.querySelector('a[href="mailto:support@sugu.pro"]')).not.toBeNull();
  });

  it("answers the account FAQ with the support address only", async () => {
    const faq = await queryFaqItems();

    expectOnlySupportAddress(JSON.stringify(faq));
    expect(JSON.stringify(faq)).toContain("support@sugu.pro");
  });

  it("falls back to the support address and no phone when the branding API is down", () => {
    expect(BRANDING_FALLBACK.site.support_email).toBe("support@sugu.pro");
    expect(BRANDING_FALLBACK.site.support_phone).toBeNull();
  });

  it("publishes the support address in the structured data", () => {
    expect(CONTACT.email).toBe("support@sugu.pro");
    expect((organizationJsonLd().contactPoint as Record<string, unknown>).email).toBe("support@sugu.pro");
  });
});
