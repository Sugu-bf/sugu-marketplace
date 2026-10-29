/**
 * A conversation is named by a ULID. The page /messages/[conversationId]
 * answers 404 to anything else, before any call; and each identifier the
 * API client puts in a path is one encoded segment, so a crafted one cannot
 * reach another route of the API or add a query to it.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ api: { get, post } }));

const { notFound, redirect } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(),
}));
vi.mock("next/navigation", () => ({ notFound, redirect }));

const { getAuthUser } = vi.hoisted(() => ({ getAuthUser: vi.fn() }));
vi.mock("@/lib/api/auth", () => ({ getAuthUser }));
vi.mock("@/app/(main)/messages/[conversationId]/ConversationPageClient", () => ({ ConversationPageClient: () => null }));

import { fetchMessages, reportMessage } from "../api";
import ConversationPage from "@/app/(main)/messages/[conversationId]/page";

const CONV = "01jkqz3m5baxnp9c7hd2fewyr4";

beforeEach(() => {
  get.mockReset().mockResolvedValue({ data: { data: { messages: [], has_more: false } } });
  post.mockReset().mockResolvedValue({ data: { data: { report_id: "r1" } } });
  notFound.mockClear();
  getAuthUser.mockReset().mockResolvedValue({ id: "u1" });
});

describe("messaging API client — identifiers in paths", () => {
  it("encodes a conversation id as one segment", async () => {
    await fetchMessages("x/../../admin?y=1#z");

    const url = String(get.mock.calls[0]?.[0]);
    expect(url).toContain("/api/v1/me/conversations/x%2F..%2F..%2Fadmin%3Fy%3D1%23z/messages");
    expect(url).not.toContain("/admin?");
  });

  it("encodes a message id as one segment", async () => {
    await reportMessage(CONV, "m/../../read", "spam");

    expect(String(post.mock.calls[0]?.[0])).toContain(`/api/v1/me/conversations/${CONV}/messages/m%2F..%2F..%2Fread/report`);
  });
});

describe("/messages/[conversationId]", () => {
  it("answers 404 to an id that is not a ULID, before anything else", async () => {
    for (const id of ["..", "abc", `${CONV}x`, "01JKQZ3M5BAXNP9C7HD2FEWYU!"]) {
      await expect(ConversationPage({ params: Promise.resolve({ conversationId: id }) })).rejects.toThrow("NEXT_NOT_FOUND");
    }
    expect(getAuthUser).not.toHaveBeenCalled();
  });

  it("opens a conversation named by a ULID", async () => {
    await expect(ConversationPage({ params: Promise.resolve({ conversationId: CONV }) })).resolves.toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });
});
