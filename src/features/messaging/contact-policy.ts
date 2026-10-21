/**
 * Contact details the server keeps out of buyer ↔ seller conversations:
 * phone numbers, e-mails, links outside SUGU. It replaces them in the text
 * (« [numéro masqué] »…); the conversation says what it masks
 * (`contact_policy.masked`), a message what was masked in it
 * (`metadata.masked`). An answer without them means nothing is masked.
 */
import type { Conversation, Message } from "@/lib/messaging/types";

export type MaskedContactKind = "phone" | "email" | "link";

const KINDS: readonly MaskedContactKind[] = ["phone", "email", "link"];

const LABELS: Record<MaskedContactKind, string> = {
  phone: "numéros de téléphone",
  email: "e-mails",
  link: "liens externes",
};

function knownKinds(value: unknown): MaskedContactKind[] {
  if (!Array.isArray(value)) return [];
  return KINDS.filter((kind) => value.includes(kind));
}

/** What this conversation masks; empty when absent or unreadable. */
export function conversationMaskedKinds(
  conversation: Pick<Conversation, "contact_policy"> | null | undefined,
): MaskedContactKind[] {
  return knownKinds(conversation?.contact_policy?.masked);
}

/** What the server masked in this message; empty when nothing was. */
export function messageMaskedKinds(message: Pick<Message, "metadata">): MaskedContactKind[] {
  const metadata = message.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  return knownKinds((metadata as Record<string, unknown>).masked);
}

/**
 * The notice shown above the composer, naming only what is masked.
 * Null when nothing is.
 */
export function contactPolicyNotice(kinds: readonly MaskedContactKind[]): string | null {
  if (kinds.length === 0) return null;
  const labels = kinds.map((kind) => LABELS[kind]);
  const list = labels.length === 1
    ? labels[0]
    : `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
  return `Pour votre sécurité, les ${list} ne sont pas transmis. Restez sur SUGU pour être protégé.`;
}
