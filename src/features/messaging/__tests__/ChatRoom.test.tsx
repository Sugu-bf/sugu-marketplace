// @vitest-environment jsdom
/**
 * The chat room marks a message read only when the buyer can see it: not
 * while the tab is in the background, but as soon as it is shown again. Its
 * header names the other side, never the buyer.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, act, waitFor, screen } from "@/test/render";

vi.mock("../api", () => ({
  fetchConversation: vi.fn(),
  fetchMessages: vi.fn(),
  markAsRead: vi.fn(),
  sendMessage: vi.fn(),
  sendTyping: vi.fn(),
}));

import { fetchConversation, fetchMessages, markAsRead } from "../api";
import { ChatRoom } from "../components/ChatRoom";
import type { Conversation, Message } from "@/lib/messaging/types";

const CONV = "01jkqz3m5baxnp9c7hd2fewyr4";
const MSG = "01jkqz3m5baxnp9c7hd2fewys1";

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: CONV,
    type: "general",
    status: "open",
    store: { id: "s1", name: "Boutique Faso", slug: "faso", logo_url: null, is_online: false },
    order_id: null,
    last_message: null,
    unread_count: 1,
    updated_at: "2026-10-29T10:00:00Z",
    created_at: "2026-10-29T10:00:00Z",
    participants: [],
    ...overrides,
  };
}

function received(): Message {
  return {
    id: MSG, sender_id: "seller-1", sender_type: "seller", sender_name: "Vendeur", body: "Bonjour",
    message_type: "text", metadata: null, is_own: false, attachments: [], is_flagged: false,
    created_at: "2026-10-29T10:01:00Z",
  };
}

let visibility: "visible" | "hidden" = "visible";

beforeEach(() => {
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect() {}
  });
  Element.prototype.scrollIntoView = vi.fn();
  vi.mocked(fetchConversation).mockReset().mockResolvedValue(conversation());
  vi.mocked(fetchMessages).mockReset().mockResolvedValue({ messages: [received()], has_more: false });
  vi.mocked(markAsRead).mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ChatRoom — read only when seen", () => {
  it("marks the last message read when the tab is visible", async () => {
    renderWithProviders(<ChatRoom conversationId={CONV} />);

    await waitFor(() => expect(vi.mocked(markAsRead)).toHaveBeenCalledWith(CONV, MSG));
  });

  it("waits for a background tab to be shown again", async () => {
    visibility = "hidden";
    const { findByText } = renderWithProviders(<ChatRoom conversationId={CONV} />);
    await findByText("Bonjour");

    expect(vi.mocked(markAsRead)).not.toHaveBeenCalled();

    visibility = "visible";
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    await waitFor(() => expect(vi.mocked(markAsRead)).toHaveBeenCalledTimes(1));
  });
});

describe("ChatRoom — the other side", () => {
  it("names the courier of a delivery conversation, not the buyer", async () => {
    vi.mocked(fetchConversation).mockResolvedValue(conversation({
      type: "courier_customer",
      store: null,
      participants: [
        { id: "u1", type: "customer", role: "customer", name: "Awa Ouédraogo" },
        { id: "c1", type: "courier", role: "courier", name: "Issa Livreur" },
      ],
    }));
    renderWithProviders(<ChatRoom conversationId={CONV} />);

    expect(await screen.findByRole("heading", { name: "Issa Livreur" })).toBeInTheDocument();
    expect(screen.queryByText("Awa Ouédraogo")).toBeNull();
  });
});
