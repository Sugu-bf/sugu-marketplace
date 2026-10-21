/**
 * Contact details masked by the server in buyer ↔ seller conversations: the
 * conversation says what it masks, a message what was masked in it. An
 * answer without these fields (an older API, a courier conversation) means
 * nothing is masked, and the notice names only what is.
 */
import { describe, expect, it } from "vitest";
import type { Conversation, Message } from "@/lib/messaging/types";
import { contactPolicyNotice, conversationMaskedKinds, messageMaskedKinds } from "../contact-policy";

const conversation = (contact_policy?: unknown) => ({ contact_policy } as Pick<Conversation, "contact_policy">);
const message = (metadata: unknown) => ({ metadata } as Pick<Message, "metadata">);

describe("conversationMaskedKinds", () => {
  it("reads what the conversation masks, in a stable order", () => {
    expect(conversationMaskedKinds(conversation({ masked: ["link", "phone", "email"] }))).toEqual(["phone", "email", "link"]);
  });

  it("treats an absent or empty policy as nothing masked", () => {
    expect(conversationMaskedKinds(undefined)).toEqual([]);
    expect(conversationMaskedKinds(null)).toEqual([]);
    expect(conversationMaskedKinds(conversation())).toEqual([]);
    expect(conversationMaskedKinds(conversation({ masked: [] }))).toEqual([]);
  });

  it("ignores what it does not know and what is not a list", () => {
    expect(conversationMaskedKinds(conversation({ masked: ["address", "phone"] }))).toEqual(["phone"]);
    expect(conversationMaskedKinds(conversation({ masked: "phone" }))).toEqual([]);
    expect(conversationMaskedKinds(conversation("phone"))).toEqual([]);
  });
});

describe("messageMaskedKinds", () => {
  it("reads what was masked in a message", () => {
    expect(messageMaskedKinds(message({ masked: ["phone"] }))).toEqual(["phone"]);
  });

  it("finds nothing in a message without it", () => {
    expect(messageMaskedKinds(message(null))).toEqual([]);
    expect(messageMaskedKinds(message({}))).toEqual([]);
    expect(messageMaskedKinds(message({ product_id: "p1" }))).toEqual([]);
    expect(messageMaskedKinds(message(["phone"]))).toEqual([]);
    expect(messageMaskedKinds(message({ masked: [] }))).toEqual([]);
  });
});

describe("contactPolicyNotice", () => {
  it("names all three when all three are masked", () => {
    expect(contactPolicyNotice(["phone", "email", "link"])).toBe(
      "Pour votre sécurité, les numéros de téléphone, e-mails et liens externes ne sont pas transmis. Restez sur SUGU pour être protégé.",
    );
  });

  it("names only what is masked", () => {
    expect(contactPolicyNotice(["phone"])).toBe(
      "Pour votre sécurité, les numéros de téléphone ne sont pas transmis. Restez sur SUGU pour être protégé.",
    );
    expect(contactPolicyNotice(["email", "link"])).toBe(
      "Pour votre sécurité, les e-mails et liens externes ne sont pas transmis. Restez sur SUGU pour être protégé.",
    );
  });

  it("says nothing when nothing is masked", () => {
    expect(contactPolicyNotice([])).toBeNull();
  });
});
