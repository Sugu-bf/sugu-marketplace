// @vitest-environment jsdom
/**
 * The live support chat follows the buyer's own channel
 * (support.chat.customer.{id}) and reads the chat again when something
 * happens there. It polls only while the socket is down, every 30 s, and
 * not at all once closed or ended. A page opens it with openSupportChat(),
 * with a subject to offer. Attachments are read through the relay.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, fireEvent, act } from "@/test/render";

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
vi.mock("@/lib/api/auth", () => ({ getAuthUser: vi.fn(async () => ({ id: "01jkqz3m5baxnp9c7hd2fewyu1" })) }));
vi.mock("../api", () => ({
  startChat: vi.fn(),
  getActiveChat: vi.fn(),
  getMessages: vi.fn(),
  sendMessage: vi.fn(),
  markRead: vi.fn(async () => {}),
  endChat: vi.fn(),
}));

import SupportChatWidget from "../SupportChatWidget";
import { openSupportChat, useSupportChatLauncher } from "../launcher";
import { getActiveChat, getMessages, sendMessage, startChat, type ChatConversation, type ChatMessage } from "../api";
import { ApiError } from "@/lib/api/errors";

const USER = "01jkqz3m5baxnp9c7hd2fewyu1";
const CHAT = "01jkqz3m5baxnp9c7hd2fewyr4";
const MSG = "01jkqz3m5baxnp9c7hd2fewys1";
const ORDER = "01jkqz3m5baxnp9c7hd2fewyo1";

function chat(overrides: Partial<ChatConversation> = {}): ChatConversation {
  return {
    id: CHAT,
    chat_status: "active",
    chat_status_label: "En cours",
    status: "open",
    subject: null,
    order_id: null,
    assigned_agent: { id: "a1", name: "Fatou" },
    last_message: null,
    last_message_id: null,
    unread_count: 0,
    created_at: "2026-10-21T10:00:00Z",
    updated_at: "2026-10-21T10:00:00Z",
    ...overrides,
  };
}

function message(id: string, body: string, overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id,
    sender_id: "a1",
    sender_type: "admin",
    sender_name: "Fatou",
    body,
    is_own: false,
    attachments: [],
    created_at: "2026-10-21T10:01:00Z",
    ...overrides,
  };
}

const flush = () => act(async () => {
  await vi.advanceTimersByTimeAsync(0);
});

beforeEach(() => {
  vi.useFakeTimers();
  Element.prototype.scrollIntoView = vi.fn();
  echoState.live = false;
  echoState.channel = null;
  echoState.events = {};
  useSupportChatLauncher.setState({ isOpen: false, suggestedSubject: null, suggestedOrderId: null, widgets: 0 });
  vi.mocked(getActiveChat).mockReset().mockResolvedValue(chat());
  vi.mocked(getMessages).mockReset().mockResolvedValue({ messages: [message(MSG, "Bonjour, je regarde votre commande.")], has_more: false });
  vi.mocked(startChat).mockReset();
  vi.mocked(sendMessage).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

async function openWidget() {
  renderWithProviders(<SupportChatWidget />);
  fireEvent.click(screen.getByRole("button", { name: "Ouvrir le chat support" }));
  await flush();
  await flush();
}

describe("SupportChatWidget — opened from the page", () => {
  it("opens with the subject the page offers, and starts the chat with it", async () => {
    vi.mocked(getActiveChat).mockResolvedValue(null);
    vi.mocked(startChat).mockResolvedValue(chat({ chat_status: "waiting_agent", assigned_agent: null }));
    renderWithProviders(<SupportChatWidget />);

    act(() => {
      expect(openSupportChat({ subject: "Commande #SGU-2026-00042", orderId: ORDER })).toBe(true);
    });
    await flush();

    const input = screen.getByPlaceholderText("Sujet (optionnel)") as HTMLInputElement;
    expect(input.value).toBe("Commande #SGU-2026-00042");

    fireEvent.click(screen.getByRole("button", { name: "Démarrer le chat" }));
    await flush();

    expect(startChat).toHaveBeenCalledWith("Commande #SGU-2026-00042", ORDER);
  });

  it("starts a chat about no order when opened from its own button", async () => {
    vi.mocked(getActiveChat).mockResolvedValue(null);
    vi.mocked(startChat).mockResolvedValue(chat({ chat_status: "waiting_agent", assigned_agent: null }));
    await openWidget();

    fireEvent.click(screen.getByRole("button", { name: "Démarrer le chat" }));
    await flush();

    expect(startChat).toHaveBeenCalledWith(undefined, undefined);
  });

  it("opens nothing on a page without the widget, and says so", () => {
    expect(openSupportChat({ subject: "Commande #SGU-2026-00042" })).toBe(false);
    expect(useSupportChatLauncher.getState().isOpen).toBe(false);
  });

  it("forgets the page's order once the widget has gone", async () => {
    const { unmount } = renderWithProviders(<SupportChatWidget />);
    act(() => {
      openSupportChat({ subject: "Commande #SGU-2026-00042", orderId: ORDER });
    });

    unmount();

    expect(useSupportChatLauncher.getState()).toMatchObject({ isOpen: false, suggestedOrderId: null, widgets: 0 });
  });

  it("offers to sign in when the buyer is signed out", async () => {
    vi.mocked(getActiveChat).mockResolvedValue(null);
    vi.mocked(startChat).mockRejectedValue(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Non authentifié." }));
    await openWidget();

    fireEvent.click(screen.getByRole("button", { name: "Démarrer le chat" }));
    await flush();

    expect(screen.getByText("Connectez-vous pour écrire au support.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Se connecter" }).getAttribute("href")).toMatch(/^\/login\?redirect=/);
  });
});

describe("SupportChatWidget — sending without duplicates", () => {
  const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const field = () => screen.getByPlaceholderText("Votre message...") as HTMLTextAreaElement;
  const sendNow = async () => {
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await flush();
  };

  it("sends each message with its identifier, and empties the field once it has gone", async () => {
    vi.mocked(sendMessage).mockResolvedValue(message("01jkqz3m5baxnp9c7hd2fewys5", "Merci", { is_own: true }));
    await openWidget();

    fireEvent.change(field(), { target: { value: "Merci" } });
    await sendNow();

    expect(sendMessage).toHaveBeenCalledWith(CHAT, "Merci", expect.stringMatching(UUID_V4));
    expect(field().value).toBe("");
    expect(screen.getByText("Merci")).toBeInTheDocument();
  });

  it("keeps the text after a failure, and sends it again with the same identifier", async () => {
    vi.mocked(sendMessage)
      .mockRejectedValueOnce(new ApiError({ status: 503, code: "SERVER_ERROR", message: "Service indisponible." }))
      .mockResolvedValueOnce(message("01jkqz3m5baxnp9c7hd2fewys6", "Mon colis ?", { is_own: true }));
    await openWidget();

    fireEvent.change(field(), { target: { value: "Mon colis ?" } });
    await sendNow();

    expect(field().value).toBe("Mon colis ?");
    expect(screen.getByRole("alert")).toHaveTextContent("Service indisponible.");

    await sendNow();

    const ids = vi.mocked(sendMessage).mock.calls.map((call) => call[2]);
    expect(ids).toHaveLength(2);
    expect(ids[1]).toBe(ids[0]);
    expect(field().value).toBe("");
  });

  it("gives another identifier to a text changed after a failure", async () => {
    vi.mocked(sendMessage)
      .mockRejectedValueOnce(new ApiError({ status: 0, code: "NETWORK_ERROR", message: "Hors ligne." }))
      .mockResolvedValueOnce(message("01jkqz3m5baxnp9c7hd2fewys7", "Mon colis est-il parti ?", { is_own: true }));
    await openWidget();

    fireEvent.change(field(), { target: { value: "Mon colis ?" } });
    await sendNow();
    fireEvent.change(field(), { target: { value: "Mon colis est-il parti ?" } });
    await sendNow();

    const ids = vi.mocked(sendMessage).mock.calls.map((call) => call[2]);
    expect(ids[1]).not.toBe(ids[0]);
  });
});

describe("SupportChatWidget — realtime", () => {
  it("follows the buyer's own channel while a chat is active", async () => {
    await openWidget();

    expect(echoState.channel).toBe(`support.chat.customer.${USER}`);
    expect(screen.getByText("Bonjour, je regarde votre commande.")).toBeInTheDocument();
  });

  it("reads the messages again when one is written", async () => {
    echoState.live = true;
    await openWidget();
    vi.mocked(getMessages).mockResolvedValue({
      messages: [message("01jkqz3m5baxnp9c7hd2fewys2", "Votre colis part demain."), message(MSG, "Bonjour, je regarde votre commande.")],
      has_more: false,
    });

    act(() => echoState.events["support.message.created"]({ conversation_id: CHAT, message_id: "01jkqz3m5baxnp9c7hd2fewys2", sender_type: "admin" }));
    await flush();

    expect(screen.getByText("Votre colis part demain.")).toBeInTheDocument();
  });

  it("ignores what happens in another chat", async () => {
    echoState.live = true;
    await openWidget();
    const reads = vi.mocked(getMessages).mock.calls.length;

    act(() => echoState.events["support.message.created"]({ conversation_id: "01jkqz3m5baxnp9c7hd2fewyr9", sender_type: "admin" }));
    await flush();

    expect(vi.mocked(getMessages).mock.calls.length).toBe(reads);
  });

  it("shows the chat ended when its status says so, and leaves the channel", async () => {
    echoState.live = true;
    await openWidget();

    act(() => echoState.events["support.status.updated"]({ conversation_id: CHAT, chat_status: "ended", status: "closed", assigned_admin_id: "a1" }));
    await flush();

    expect(screen.getAllByText("Chat terminé").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Démarrer un nouveau chat" })).toBeInTheDocument();
    expect(echoState.channel).toBeNull();
  });

  it("shows the agent typing, then lets it fade", async () => {
    echoState.live = true;
    await openWidget();

    act(() => echoState.events["support.typing"]({ conversation_id: CHAT, user_id: "a1", user_name: "Fatou", participant_type: "admin" }));
    expect(screen.getByText("Fatou écrit…")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_100);
    });
    expect(screen.queryByText("Fatou écrit…")).toBeNull();
  });
});

describe("SupportChatWidget — polling only as a fallback", () => {
  it("reads the chat every 30 s while the socket is down", async () => {
    echoState.live = false;
    await openWidget();
    const reads = vi.mocked(getMessages).mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_000);
    });
    expect(vi.mocked(getMessages).mock.calls.length).toBe(reads);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_500);
    });
    expect(vi.mocked(getMessages).mock.calls.length).toBe(reads + 1);
  });

  it("does not poll while the socket is live", async () => {
    echoState.live = true;
    await openWidget();
    const reads = vi.mocked(getMessages).mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });

    expect(vi.mocked(getMessages).mock.calls.length).toBe(reads);
  });

  it("stops polling once the widget is closed", async () => {
    echoState.live = false;
    await openWidget();
    fireEvent.click(screen.getByRole("button", { name: "Fermer le chat support" }));
    await flush();
    const reads = vi.mocked(getMessages).mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });

    expect(vi.mocked(getMessages).mock.calls.length).toBe(reads);
  });

  it("does not poll an ended chat", async () => {
    echoState.live = false;
    vi.mocked(getActiveChat).mockResolvedValue(chat({ chat_status: "ended" }));
    await openWidget();
    const reads = vi.mocked(getMessages).mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(120_000);
    });

    expect(vi.mocked(getMessages).mock.calls.length).toBe(reads);
  });
});

describe("SupportChatWidget — attachments and a new chat", () => {
  it("reads an attachment through the relay, and renders nothing for another path", async () => {
    const path = `me/support-chat/${CHAT}/messages/${MSG}/attachments/7`;
    vi.mocked(getMessages).mockResolvedValue({
      messages: [
        message(MSG, "Voici le bon", {
          attachments: [
            { id: 7, type: "image", path, name: "bon.jpg", size: 10, mime_type: "image/jpeg" },
            { id: 8, type: "file", path: "https://cdn.example.test/x.pdf", name: "x.pdf", size: 10, mime_type: "application/pdf" },
          ],
        }),
      ],
      has_more: false,
    });

    await openWidget();

    expect(screen.getByAltText("bon.jpg")).toHaveAttribute("src", `/api/backend/api/v1/${path}`);
    expect(screen.queryByText("x.pdf")).toBeNull();
  });

  it("starts a new chat after an ended one", async () => {
    vi.mocked(getActiveChat).mockResolvedValue(chat({ chat_status: "ended" }));
    await openWidget();

    fireEvent.click(screen.getByRole("button", { name: "Démarrer un nouveau chat" }));

    expect(screen.getByRole("button", { name: "Démarrer le chat" })).toBeInTheDocument();
  });
});
