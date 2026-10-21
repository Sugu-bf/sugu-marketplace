// @vitest-environment jsdom
/**
 * The help centre and the policy pages give only real ways to reach Sugu:
 * no placeholder phone number, no WhatsApp link, no availability promise,
 * one support address (support@sugu.pro), and the live chat where a phone
 * used to be. The site-wide JSON-LD publishes no phone either.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/render";

vi.mock("@/features/faq", async () => ({
  ...(await vi.importActual<typeof import("@/features/faq")>("@/features/faq")),
  queryFaqItems: vi.fn(async () => []),
}));

import HelpCenterPage from "../help/page";
import AntiFraudPolicyPage from "../politique-anti-fraude/page";
import PrivacyPolicyPage from "../politique-de-confidentialite/page";
import DeliveryPolicyPage from "../politique-livraison-retours/page";
import TermsPage from "../conditions-generales/page";
import { organizationJsonLd } from "@/lib/seo/structured-data";

// WhatsApp may be named (a notification channel); it is never a contact link.
const INVENTED_TEXT = [/\+226/, /wa\.me/i, /24\s?\/\s?7/, /sugu\.bf/, /Lun-Sam/];
const INVENTED_LINKS = [/^tel:/, /wa\.me/i, /whatsapp/i, /sugu\.bf/];

function expectNothingInvented(container: HTMLElement) {
  const text = container.textContent ?? "";
  const links = Array.from(container.querySelectorAll("a")).map((a) => a.getAttribute("href") ?? "");
  for (const pattern of INVENTED_TEXT) {
    expect(text, String(pattern)).not.toMatch(pattern);
  }
  for (const pattern of INVENTED_LINKS) {
    expect(links.filter((href) => pattern.test(href)), String(pattern)).toEqual([]);
  }
}

describe("help centre", () => {
  it("shows the support address and the chat, nothing invented", async () => {
    const { container } = render(await HelpCenterPage());

    expectNothingInvented(container);
    expect(screen.getByRole("link", { name: /support@sugu\.pro/ })).toHaveAttribute("href", "mailto:support@sugu.pro");
    expect(screen.getByRole("link", { name: "Ouvrir le chat" })).toHaveAttribute("href", "/support-chat");
  });
});

describe("policy pages", () => {
  it.each([
    ["anti-fraude", AntiFraudPolicyPage],
    ["confidentialité", PrivacyPolicyPage],
    ["livraison et retours", DeliveryPolicyPage],
    ["conditions générales", TermsPage],
  ])("the %s page gives no invented contact", (_name, Page) => {
    const { container } = render(<Page />);

    expectNothingInvented(container);
  });

  it("points to the live chat where a phone line used to be", () => {
    const fraud = render(<AntiFraudPolicyPage />);
    expect(fraud.container.querySelectorAll('a[href="/support-chat"]').length).toBeGreaterThanOrEqual(2);
    fraud.unmount();

    const delivery = render(<DeliveryPolicyPage />);
    expect(delivery.container.querySelector('a[href="/support-chat"]')).not.toBeNull();
    expect(delivery.container.querySelector('a[href="mailto:support@sugu.pro"]')).not.toBeNull();
  });
});

describe("structured data", () => {
  it("publishes no phone number for Sugu", () => {
    const contactPoint = organizationJsonLd().contactPoint as Record<string, unknown>;

    expect(contactPoint).not.toHaveProperty("telephone");
    expect(JSON.stringify(organizationJsonLd())).not.toMatch(/\+226/);
  });
});
