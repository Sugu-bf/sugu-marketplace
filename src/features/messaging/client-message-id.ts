/**
 * The identifier a message is sent with (`client_message_id`), chosen once
 * per message: sent again with it, the same message is answered (HTTP 200)
 * instead of a second one being written.
 */

/** A UUID v4, as Laravel's `uuid` rule reads it. */
export function newClientMessageId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }

  // randomUUID() exists only on HTTPS and localhost; getRandomValues()
  // everywhere. Same randomness, laid out as RFC 9562 version 4.
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * What makes two sends "the same message": same conversation, same text,
 * same files. A send retried as it was keeps its identifier; once the text or
 * the files change, it is another message and gets a new one.
 */
export function draftSignature(conversationId: string, body: string, files: readonly File[]): string {
  return JSON.stringify([
    conversationId,
    body,
    files.map((f) => [f.name, f.size, f.type, f.lastModified]),
  ]);
}
