// @vitest-environment jsdom
/**
 * The terms, the delivery and returns policy and the account FAQ promise
 * nothing the site does not do (P1-20): a buyer cannot cancel an order nor
 * open a dispute from the site — such a request goes to support@sugu.pro. A
 * return is asked within 48 h of the delivery, 24 h for fresh products, and
 * a seller's wallet is credited from 72 h after the delivery, not at 72 h.
 */
import { describe, expect, it } from "vitest";
import { render } from "@/test/render";

import TermsPage from "../conditions-generales/page";
import DeliveryPolicyPage from "../politique-livraison-retours/page";
import { queryFaqItems } from "@/features/account/queries/account-queries";
import { BRANDING_FALLBACK } from "@/lib/branding.service";

const text = (node: React.ReactElement) => (render(node).container.textContent ?? "").replace(/\s+/g, " ");

const SELF_SERVICE_PROMISES = [
  /acheteur peut annuler/i,
  /litige (est|sera) automatiquement ouvert/i,
  /litige auto-ouvert/i,
  /ouverture automatique de litige/i,
  /depuis l'espace client\. Chaque litige/i,
  /ouvrir un litige/i,
  /DSP-/,
];

describe("terms of sale", () => {
  const terms = () => text(<TermsPage />);

  it("promises no cancellation or dispute from the site", () => {
    const page = terms();
    for (const pattern of SELF_SERVICE_PROMISES) expect(page).not.toMatch(pattern);
    expect(page).toMatch(/ne peut pas annuler lui-même une commande depuis la plateforme/);
    expect(page).toMatch(/Aucun litige ne peut être ouvert directement depuis l'espace client/);
  });

  it("sends cancellations and claims to the support address", () => {
    const { container } = render(<TermsPage />);
    const mailto = Array.from(container.querySelectorAll("a[href^='mailto:']")).map((a) => a.getAttribute("href"));
    expect(mailto.length).toBeGreaterThanOrEqual(3);
    expect(new Set(mailto)).toEqual(new Set(["mailto:support@sugu.pro"]));
  });

  it("gives the return window: 48 h after the delivery, 24 h for fresh products", () => {
    expect(terms()).toMatch(/48 heures suivant la livraison.*24 heures.*produits frais/);
  });

  it("credits the seller's wallet from 72 h after the delivery, not at 72 h", () => {
    const page = terms();
    expect(page).toMatch(/à partir de 72 heures après la confirmation de livraison/);
    expect(page).toMatch(/au moins 72 heures/);
    expect(page).not.toMatch(/crédité 72 heures/);
  });
});

describe("delivery and returns policy", () => {
  it("routes claims and returns to the support, within 48 h (24 h fresh)", () => {
    const page = text(<DeliveryPolicyPage />);
    for (const pattern of SELF_SERVICE_PROMISES) expect(page).not.toMatch(pattern);
    expect(page).toMatch(/demande de retour est adressée au support à support@sugu\.pro dans les 48 heures suivant la livraison, et dans les 24 heures pour les produits frais/);
    expect(page).toMatch(/ne peut être faite directement depuis le site : elle passe par le support/);
  });
});

describe("account FAQ", () => {
  it("gives the support address only, and the same rules", async () => {
    const answers = (await queryFaqItems()).map((f) => f.answer).join(" ");
    expect(answers).not.toMatch(/\+226|64528958|téléphone|WhatsApp/i);
    expect(answers).not.toMatch(/Vous pouvez modifier ou annuler/);
    expect(answers).toMatch(/ne peut pas être modifiée ni annulée depuis le site/);
    expect(answers).toMatch(/48 h suivant la livraison, ou dans les 24 h pour les produits frais/);
    expect(answers).toMatch(/support@sugu\.pro/);
  });
});

describe("branding fallback", () => {
  it("publishes the support address and no phone", () => {
    expect(BRANDING_FALLBACK.site.support_email).toBe("support@sugu.pro");
    expect(BRANDING_FALLBACK.site.support_phone).toBeNull();
  });
});
