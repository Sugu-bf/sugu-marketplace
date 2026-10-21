/**
 * The identifier a message is sent with: a UUID v4, chosen once per message,
 * also where randomUUID() is missing (a page served over plain HTTP).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { draftSignature, newClientMessageId } from "../client-message-id";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("newClientMessageId", () => {
  it("is a UUID v4, a new one each time", () => {
    const a = newClientMessageId();
    const b = newClientMessageId();
    expect(a).toMatch(UUID_V4);
    expect(b).toMatch(UUID_V4);
    expect(a).not.toBe(b);
  });

  it("is still a UUID v4 without randomUUID()", () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array) => real.getRandomValues(bytes) });

    const ids = new Set(Array.from({ length: 50 }, () => newClientMessageId()));

    expect(ids.size).toBe(50);
    for (const id of ids) expect(id).toMatch(UUID_V4);
  });
});

describe("draftSignature", () => {
  const file = (name: string, size = 3, lastModified = 1) =>
    new File([new Uint8Array(size)], name, { type: "image/png", lastModified });

  it("is the same for the same message sent again", () => {
    expect(draftSignature("c1", "Bonjour", [file("a.png")])).toBe(draftSignature("c1", "Bonjour", [file("a.png")]));
  });

  it("changes with the text, the files or the conversation", () => {
    const base = draftSignature("c1", "Bonjour", [file("a.png")]);
    expect(draftSignature("c1", "Bonjour !", [file("a.png")])).not.toBe(base);
    expect(draftSignature("c1", "Bonjour", [file("b.png")])).not.toBe(base);
    expect(draftSignature("c1", "Bonjour", [file("a.png", 4)])).not.toBe(base);
    expect(draftSignature("c1", "Bonjour", [])).not.toBe(base);
    expect(draftSignature("c2", "Bonjour", [file("a.png")])).not.toBe(base);
  });
});
