// @vitest-environment jsdom
/**
 * /messages follows the buyer's own channel. Without it (no Reverb key,
 * socket down, channel refused) nothing would come: the list and the open
 * conversation are read again every 30 s while the tab is visible, and at
 * once when the socket is back. A new message is counted once: by the
 * server, in the list it sends again.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderWithProviders, render, act, screen } from "@/test/render";

const echoState = vi.hoisted(() => ({
  live: false,
  channel: null as string | null,
  events: {} as Record<string, (payload: unknown) => void>,
}));

vi.mock("@/lib/messaging/hooks/useEchoChannel", () => ({
  useEchoChannel: (channel: string | null, events: Record<string, (payload: unknown) => void>) => {
    echoState.channel = channel ?? null;
    echoState.events = events;
    return !!channel && echoState.live;
  },
}));

vi.mock("../api", () => ({
  fetchConversations: vi.fn(),
  fetchConversation: vi.fn(),
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  sendProductCard: vi.fn(),
  markAsRead: vi.fn(),
  sendTyping: vi.fn(),
  fetchPresence: vi.fn(),
  fetchRecommendedProducts: vi.fn(),
  startConversation: vi.fn(),
  startCourierConversation: vi.fn(),
  reportMessage: vi.fn(),
}));

import { fetchConversation, fetchConversations, fetchMessages, fetchPresence, fetchRecommendedProducts, markAsRead } from "../api";
import { MessagingPage } from "../components/MessagingPage";
import { useMessagingStore } from "../hooks";
import type { AuthUser } from "@/lib/api/auth";
import type { Conversation } from "@/lib/messaging/types";

const USER = { id: "01jkqz3m5baxnp9c7hd2fewyu1", name: "Awa" } as AuthUser;
const CONV = "01jkqz3m5baxnp9c7hd2fewyr4";

function conversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: CONV,
    type: "general",
    status: "open",
    store: { id: "s1", name: "Boutique Faso", slug: "faso", logo_url: null, is_online: false },
    order_id: null,
    last_message: null,
    unread_count: 0,
    updated_at: "2026-10-29T10:00:00Z",
    created_at: "2026-10-29T10:00:00Z",
    participants: [],
    ...overrides,
  };
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", class {
    observe() {}
    disconnect() {}
  });
  Element.prototype.scrollIntoView = vi.fn();
  echoState.live = false;
  useMessagingStore.setState({ activeConversationId: null, mobileView: "list" });
  vi.mocked(fetchConversations).mockReset().mockResolvedValue({ data: [conversation()], meta: { has_more: false, next_cursor: null } });
  vi.mocked(fetchConversation).mockReset().mockResolvedValue(conversation());
  vi.mocked(fetchMessages).mockReset().mockResolvedValue({ messages: [], has_more: false });
  vi.mocked(fetchPresence).mockReset().mockResolvedValue([]);
  vi.mocked(fetchRecommendedProducts).mockReset().mockResolvedValue([]);
  vi.mocked(markAsRead).mockReset().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("MessagingPage — without realtime", () => {
  it("reads the list and the open conversation again every 30 s while the socket is down", async () => {
    useMessagingStore.setState({ activeConversationId: CONV, mobileView: "chat" });
    renderWithProviders(<MessagingPage user={USER} />);
    await flush();
    const lists = vi.mocked(fetchConversations).mock.calls.length;
    const reads = vi.mocked(fetchMessages).mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_000);
    });
    expect(vi.mocked(fetchConversations).mock.calls.length).toBe(lists);
    expect(vi.mocked(fetchMessages).mock.calls.length).toBe(reads);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    expect(vi.mocked(fetchConversations).mock.calls.length).toBeGreaterThan(lists);
    expect(vi.mocked(fetchMessages).mock.calls.length).toBeGreaterThan(reads);
  });

  it("does not poll while the socket is live", async () => {
    echoState.live = true;
    useMessagingStore.setState({ activeConversationId: CONV, mobileView: "chat" });
    renderWithProviders(<MessagingPage user={USER} />);
    await flush();
    const lists = vi.mocked(fetchConversations).mock.calls.length;
    const reads = vi.mocked(fetchMessages).mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });

    expect(vi.mocked(fetchConversations).mock.calls.length).toBe(lists);
    expect(vi.mocked(fetchMessages).mock.calls.length).toBe(reads);
  });

  it("does not poll in a hidden tab", async () => {
    const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    renderWithProviders(<MessagingPage user={USER} />);
    await flush();
    const lists = vi.mocked(fetchConversations).mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });

    expect(vi.mocked(fetchConversations).mock.calls.length).toBe(lists);
    visibility.mockRestore();
  });

  it("reads everything again once the socket is back", async () => {
    useMessagingStore.setState({ activeConversationId: CONV, mobileView: "chat" });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const page = () => (
      <QueryClientProvider client={client}>
        <MessagingPage user={USER} />
      </QueryClientProvider>
    );
    const { rerender } = render(page());
    await flush();
    const lists = vi.mocked(fetchConversations).mock.calls.length;
    const reads = vi.mocked(fetchMessages).mock.calls.length;

    echoState.live = true;
    rerender(page());
    await flush();

    expect(vi.mocked(fetchConversations).mock.calls.length).toBeGreaterThan(lists);
    expect(vi.mocked(fetchMessages).mock.calls.length).toBeGreaterThan(reads);
  });
});

describe("MessagingPage — unread messages", () => {
  it("counts a new message once: the list read again says how many", async () => {
    renderWithProviders(<MessagingPage user={USER} />);
    await flush();
    vi.mocked(fetchConversations).mockResolvedValue({
      data: [conversation({ unread_count: 1, last_message: { id: "01jkqz3m5baxnp9c7hd2fewys1", body: "Bonjour", sender_type: "seller", created_at: "2026-10-29T10:01:00Z" } })],
      meta: { has_more: false, next_cursor: null },
    });

    await act(async () => {
      echoState.events["message.created"]?.({ conversation_id: CONV, sender_id: "seller-1", message_id: "01jkqz3m5baxnp9c7hd2fewys1" });
    });
    await flush();

    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.queryByText("2")).toBeNull();
  });
});
