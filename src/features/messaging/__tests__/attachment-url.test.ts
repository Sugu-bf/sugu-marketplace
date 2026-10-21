/**
 * Attachments are not public any more: the browser reads them through the
 * relay, from the API path the server gave. Only a path of the exact shape
 * of a buyer attachment, for that very message, becomes an address; any
 * other string renders nothing.
 */
import { describe, expect, it } from "vitest";
import { attachmentUrl, safeHref, safeSrc } from "../security";

const CONV = "01jkqz3m5baxnp9c7hd2fewyr4";
const MSG = "01jkqz3m5baxnp9c7hd2fewys1";
const OTHER_MSG = "01jkqz3m5baxnp9c7hd2fewys2";
const PATH = `me/conversations/${CONV}/messages/${MSG}/attachments/42`;
const CHAT_PATH = `me/support-chat/${CONV}/messages/${MSG}/attachments/7`;

describe("attachmentUrl", () => {
  it("reads a buyer conversation attachment through the relay", () => {
    expect(attachmentUrl(PATH, "conversation", MSG)).toBe(`/api/backend/api/v1/${PATH}`);
    expect(attachmentUrl(PATH, "conversation")).toBe(`/api/backend/api/v1/${PATH}`);
  });

  it("reads a support chat attachment through the relay", () => {
    expect(attachmentUrl(CHAT_PATH, "supportChat", MSG)).toBe(`/api/backend/api/v1/${CHAT_PATH}`);
  });

  it("keeps each kind to its own route", () => {
    expect(attachmentUrl(CHAT_PATH, "conversation", MSG)).toBeNull();
    expect(attachmentUrl(PATH, "supportChat", MSG)).toBeNull();
  });

  it("refuses the path of another message", () => {
    expect(attachmentUrl(PATH, "conversation", OTHER_MSG)).toBeNull();
  });

  it.each([
    ["an absolute address", `https://evil.test/${PATH}`],
    ["a protocol-relative address", `//evil.test/${PATH}`],
    ["a leading slash", `/${PATH}`],
    ["a way up", `me/conversations/${CONV}/messages/${MSG}/attachments/../../../../seller/x`],
    ["a dot segment", `me/conversations/${CONV}/messages/${MSG}/./attachments/42`],
    ["a query", `${PATH}?download=1`],
    ["a fragment", `${PATH}#x`],
    ["an encoded slash", `me/conversations/${CONV}%2F..%2F/messages/${MSG}/attachments/42`],
    ["a backslash", PATH.replace("/attachments/", "\\attachments\\")],
    ["a media id that is not a number", `me/conversations/${CONV}/messages/${MSG}/attachments/abc`],
    ["a short id", `me/conversations/abc/messages/${MSG}/attachments/42`],
    ["a trailing slash", `${PATH}/`],
    ["a new line", `${PATH}\n`],
    ["another route of the API", `seller/conversations/${CONV}/messages/${MSG}/attachments/42`],
    ["a ticket attachment", `me/tickets/${CONV}/messages/${MSG}/attachments/42`],
    ["a javascript: address", "javascript:alert(1)"],
    ["an empty string", ""],
  ])("renders nothing for %s", (_label, path) => {
    expect(attachmentUrl(path, "conversation", MSG)).toBeNull();
  });

  it.each([null, undefined, 42, {}, ["me"]])("renders nothing for a path of type %s", (path) => {
    expect(attachmentUrl(path, "conversation")).toBeNull();
  });

  it("gives an address the src and href guards keep as it is", () => {
    const url = attachmentUrl(PATH, "conversation", MSG);
    expect(safeSrc(url)).toBe(url);
    expect(safeHref(url)).toBe(url);
  });
});
