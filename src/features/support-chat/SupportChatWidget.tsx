"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getAuthUser } from "@/lib/api/auth";
import { isApiError } from "@/lib/api/errors";
import { useEchoChannel } from "@/lib/messaging/hooks/useEchoChannel";
import { attachmentUrl, safeHref, safeSrc, safeFilename } from "@/features/messaging/security";
import { newClientMessageId, draftSignature } from "@/features/messaging/client-message-id";
import { useSupportChatLauncher } from "./launcher";
import {
  startChat,
  getActiveChat,
  getMessages,
  sendMessage,
  markRead,
  endChat as endChatApi,
  type ChatConversation,
  type ChatMessage,
  type SupportMessageCreatedPayload,
  type SupportStatusUpdatedPayload,
  type SupportTypingPayload,
} from "./api";

/** Without the socket, an open chat is read again this often. */
const FALLBACK_POLL_MS = 30_000;
/** An agent's « écrit… » fades when no new signal comes. */
const TYPING_TIMEOUT_MS = 3_000;

function errorMessage(err: unknown): string {
  if (isSignedOut(err)) return "Connectez-vous pour écrire au support.";
  return err instanceof Error && err.message
    ? err.message
    : "Une erreur est survenue. Réessayez.";
}

function isSignedOut(err: unknown): boolean {
  return isApiError(err) && err.status === 401;
}

/** Sign in, then come back to this page. Only read in the browser. */
function loginHref(): string {
  if (typeof window === "undefined") return "/login";
  return `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}

// ── Chat Widget Hook ────────────────────────────
function useSupportChat(isOpen: boolean) {
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The last failure was a missing session: the widget offers to sign in.
  const [signedOut, setSignedOut] = useState(false);
  // The signed-in buyer: their private channel is support.chat.customer.{id}.
  const [userId, setUserId] = useState<string | null>(null);
  const [typingName, setTypingName] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // What the socket callbacks (bound once per channel) read.
  const conversationRef = useRef(conversation);
  const isOpenRef = useRef(isOpen);
  useEffect(() => {
    conversationRef.current = conversation;
    isOpenRef.current = isOpen;
  });

  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

  // The buyer has read up to this message: told to the server (once per
  // message), and the badge no longer counts it.
  const lastSeenIdRef = useRef<string | null>(null);
  const markSeen = useCallback((chatId: string, list: ChatMessage[]) => {
    const last = list[list.length - 1];
    if (!last || last.is_own || last.id === lastSeenIdRef.current) return;
    lastSeenIdRef.current = last.id;
    markRead(chatId, last.id).catch(() => {});
    setConversation((prev) => (prev && prev.id === chatId ? { ...prev, unread_count: 0 } : prev));
  }, []);

  // Fetch the active chat when the widget opens
  const userAskedRef = useRef(false);
  const loadActiveChat = useCallback(async () => {
    if (!userAskedRef.current) {
      userAskedRef.current = true;
      getAuthUser()
        .then((user) => setUserId(user?.id ?? null))
        .catch(() => {
          userAskedRef.current = false;
        });
    }
    try {
      const chat = await getActiveChat();
      if (chat) {
        setConversation(chat);
        const result = await getMessages(chat.id);
        const list = result.messages.reverse();
        setMessages(list);
        markSeen(chat.id, list);
      }
    } catch {
      // No active chat — that's fine
    }
  }, [markSeen]);

  // Read the latest messages again and add the new ones.
  const refreshMessages = useCallback(async () => {
    const current = conversationRef.current;
    if (!current) return;
    try {
      const result = await getMessages(current.id, undefined, 50);
      if (conversationRef.current?.id !== current.id) return;
      const newMsgs = result.messages.reverse();
      if (newMsgs.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const unique = newMsgs.filter((m) => !existingIds.has(m.id));
          return unique.length > 0 ? [...prev, ...unique] : prev;
        });
        if (isOpenRef.current) markSeen(current.id, newMsgs);
      }
    } catch {
      /* ignore */
    }
  }, [markSeen]);

  // Read the chat's state again (agent, status, unread count). No active
  // chat any more means this one has ended.
  const refreshConversation = useCallback(async () => {
    const current = conversationRef.current;
    if (!current || current.chat_status === "ended") return;
    try {
      const chat = await getActiveChat();
      if (conversationRef.current?.id !== current.id) return;
      if (!chat) {
        setConversation((prev) => (prev && prev.id === current.id ? { ...prev, chat_status: "ended" } : prev));
      } else if (chat.id === current.id) {
        setConversation(isOpenRef.current ? { ...chat, unread_count: 0 } : chat);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const fail = useCallback((err: unknown) => {
    setError(errorMessage(err));
    setSignedOut(isSignedOut(err));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setSignedOut(false);
  }, []);

  // Start a new chat, about the buyer's order when the page gave one
  const start = useCallback(async (subject?: string, orderId?: string) => {
    setIsLoading(true);
    clearError();
    try {
      const chat = await startChat(subject, orderId);
      setConversation(chat);
      const result = await getMessages(chat.id);
      setMessages(result.messages.reverse());
    } catch (err: unknown) {
      fail(err);
    } finally {
      setIsLoading(false);
    }
  }, [clearError, fail]);

  // Send message, with the identifier chosen for it. True once it has gone.
  const send = useCallback(
    async (body: string, clientMessageId: string): Promise<boolean> => {
      if (!conversation) return false;
      clearError();
      try {
        const msg = await sendMessage(conversation.id, body, clientMessageId);
        // The socket may have brought it in already.
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        return true;
      } catch (err: unknown) {
        fail(err);
        return false;
      }
    },
    [conversation, clearError, fail]
  );

  // End chat
  const end = useCallback(async () => {
    if (!conversation) return;
    try {
      await endChatApi(conversation.id);
      setConversation((prev) =>
        prev ? { ...prev, chat_status: "ended" } : null
      );
    } catch (err: unknown) {
      fail(err);
    }
  }, [conversation, fail]);

  // Leave an ended chat to start another one
  const reset = useCallback(() => {
    setConversation(null);
    setMessages([]);
    clearError();
  }, [clearError]);

  // ─── Realtime: the buyer's own support channel ───
  const chatActive = !!conversation && conversation.chat_status !== "ended";
  const isLive = useEchoChannel(
    userId && chatActive ? `support.chat.customer.${userId}` : null,
    {
      "support.message.created": (payload) => {
        const event = payload as SupportMessageCreatedPayload | null;
        if (!event || event.conversation_id !== conversationRef.current?.id) return;
        if (event.sender_type !== "customer") {
          clearTimeout(typingTimerRef.current);
          setTypingName(null);
        }
        void refreshMessages();
        // Closed, the badge tells the buyer an answer is waiting.
        if (!isOpenRef.current) void refreshConversation();
      },
      "support.status.updated": (payload) => {
        const event = payload as SupportStatusUpdatedPayload | null;
        if (!event || event.conversation_id !== conversationRef.current?.id) return;
        const chatStatus = event.chat_status;
        if (chatStatus) {
          setConversation((prev) =>
            prev && prev.id === event.conversation_id
              ? { ...prev, chat_status: chatStatus, status: event.status ?? prev.status }
              : prev
          );
        }
        // The agent's name comes with the chat itself.
        if (chatStatus !== "ended") void refreshConversation();
      },
      "support.typing": (payload) => {
        const event = payload as SupportTypingPayload | null;
        if (!event || event.conversation_id !== conversationRef.current?.id) return;
        if (event.participant_type !== "admin") return;
        setTypingName(event.user_name || "L'agent");
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTypingName(null), TYPING_TIMEOUT_MS);
      },
    }
  );

  // Once the socket is back, catch up on what it may have missed.
  useEffect(() => {
    if (!isLive) return;
    void refreshMessages();
    void refreshConversation();
  }, [isLive, refreshMessages, refreshConversation]);

  // Without the socket only, and only while the chat is open and active:
  // read it again now and then.
  useEffect(() => {
    if (!isOpen || !chatActive || isLive) return;
    const timer = setInterval(() => {
      void refreshMessages();
      void refreshConversation();
    }, FALLBACK_POLL_MS);
    return () => clearInterval(timer);
  }, [isOpen, chatActive, isLive, refreshMessages, refreshConversation]);

  return {
    conversation,
    messages,
    isLoading,
    error,
    signedOut,
    typingName: chatActive ? typingName : null,
    loadActiveChat,
    start,
    send,
    end,
    reset,
  };
}

// ── Main Chat Widget Component ──────────────────
export default function SupportChatWidget() {
  // Open from its own button, or from the page (openSupportChat()).
  const isOpen = useSupportChatLauncher((s) => s.isOpen);
  const toggleOpen = useSupportChatLauncher((s) => s.toggle);
  const register = useSupportChatLauncher((s) => s.register);
  const suggestedSubject = useSupportChatLauncher((s) => s.suggestedSubject);
  const suggestedOrderId = useSupportChatLauncher((s) => s.suggestedOrderId);
  // null until the buyer types: the page's suggestion shows meanwhile.
  const [subject, setSubject] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  // The identifier of the message being sent, kept until it has gone: sent
  // again after a failure, it is the same message for the server.
  const draftRef = useRef<{ id: string; signature: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chat = useSupportChat(isOpen);
  const { loadActiveChat } = chat;
  const subjectValue = subject ?? suggestedSubject ?? "";

  // Say the page has a widget; leaving the page closes it, so another
  // page's widget starts closed and without this page's order.
  useEffect(() => register(), [register]);

  // Load active chat on open
  useEffect(() => {
    if (isOpen) {
      void loadActiveChat();
    }
  }, [isOpen, loadActiveChat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    await chat.start(subjectValue.trim() || undefined, suggestedOrderId ?? undefined);
    setSubject(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const conversationId = chat.conversation?.id;
    if (!messageInput.trim() || isSending || !conversationId) return;
    const text = messageInput;
    const signature = draftSignature(conversationId, text, []);
    if (!draftRef.current || draftRef.current.signature !== signature) {
      draftRef.current = { id: newClientMessageId(), signature };
    }

    setIsSending(true);
    const sent = await chat.send(text, draftRef.current.id);
    setIsSending(false);
    // Gone: the field empties (unless more was typed meanwhile). Failed:
    // the text stays, and sending it again is safe.
    if (sent) {
      draftRef.current = null;
      setMessageInput((current) => (current === text ? "" : current));
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const isActive =
    chat.conversation?.chat_status !== "ended";

  return (
    <>
      {/* Floating Button */}
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={isOpen ? "Fermer le chat support" : "Ouvrir le chat support"}
        aria-expanded={isOpen}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{
          background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
        }}
      >
        {isOpen ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18" />
            <path d="M6 6l12 12" />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {/* Notification Badge */}
        {chat.conversation && (chat.conversation.unread_count ?? 0) > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {chat.conversation.unread_count}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-[9998] w-[380px] max-w-[calc(100vw-2rem)] shadow-2xl rounded-2xl overflow-hidden flex flex-col"
          style={{
            height: "min(540px, calc(100vh - 8rem))",
            fontFamily: "'Quicksand', 'Segoe UI', system-ui, sans-serif",
          }}
        >
          {/* Header */}
          <div
            className="flex-shrink-0 px-5 py-4 flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
            }}
          >
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm">
                Chat Support
              </h3>
              <p className="text-white/70 text-xs">
                {chat.conversation
                  ? chat.conversation.chat_status === "waiting_agent"
                    ? "En attente d'un agent..."
                    : chat.conversation.chat_status === "active"
                    ? `Avec ${chat.conversation.assigned_agent?.name ?? "un agent"}`
                    : "Chat terminé"
                  : "Nous sommes là pour vous aider !"}
              </p>
            </div>
            {chat.conversation && isActive && (
              <button
                onClick={() => {
                  if (confirm("Terminer ce chat ?")) chat.end();
                }}
                className="text-white/60 hover:text-white transition-colors"
                title="Terminer le chat"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            {/* Start Form — whenever no chat is open */}
            {!chat.conversation && (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{
                    background:
                      "linear-gradient(135deg, #fef3e2 0%, #fde8d8 100%)",
                  }}
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h4 className="text-gray-900 font-semibold text-base mb-1">
                  Besoin d&apos;aide ?
                </h4>
                <p className="text-gray-500 text-xs text-center mb-5 leading-relaxed">
                  Notre équipe est prête à vous aider.
                  <br />
                  Décrivez votre problème pour commencer.
                </p>
                <form onSubmit={handleStart} className="w-full space-y-3">
                  <input
                    type="text"
                    value={subjectValue}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Sujet (optionnel)"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={chat.isLoading}
                    className="w-full py-2.5 text-sm font-medium text-white rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                    style={{
                      background:
                        "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
                    }}
                  >
                    {chat.isLoading ? "Connexion..." : "Démarrer le chat"}
                  </button>
                </form>
                {chat.error && (
                  <p className="text-red-500 text-xs mt-2">{chat.error}</p>
                )}
                {chat.signedOut && (
                  <a href={loginHref()} className="text-xs font-medium text-orange-600 underline underline-offset-2 mt-1">
                    Se connecter
                  </a>
                )}
              </div>
            )}

            {/* Messages View */}
            {chat.conversation && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {chat.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_own ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[80%]">
                        {/* Sender */}
                        <p
                          className={`text-[10px] text-gray-400 mb-0.5 ${msg.is_own ? "text-right" : "text-left"}`}
                        >
                          {msg.is_own ? "Vous" : msg.sender_name} ·{" "}
                          {formatTime(msg.created_at)}
                        </p>
                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            msg.is_own
                              ? "bg-orange-500 text-white rounded-tr-sm"
                              : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm shadow-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.body}
                          </p>
                          {/* Attachments */}
                          <ChatAttachments message={msg} />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Waiting indicator */}
                  {chat.conversation.chat_status === "waiting_agent" &&
                    chat.messages.length === 0 && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                          </div>
                          Un agent va vous répondre...
                        </div>
                      </div>
                    )}

                  {/* Ended notice */}
                  {chat.conversation.chat_status === "ended" && (
                    <div className="text-center py-3">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-full text-xs">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        Chat terminé
                      </div>
                    </div>
                  )}

                  {/* An agent is typing (live only) */}
                  {chat.typingName && (
                    <p className="text-[11px] text-gray-400 italic" aria-live="polite">
                      {chat.typingName} écrit…
                    </p>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                {isActive && (
                  <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3">
                    <form
                      onSubmit={handleSend}
                      className="flex items-end gap-2"
                    >
                      <textarea
                        ref={inputRef}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Votre message..."
                        rows={1}
                        className="flex-1 resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isSending}
                        aria-label="Envoyer"
                        className="p-2.5 rounded-xl text-white transition-all disabled:opacity-40"
                        style={{
                          background:
                            "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
                        }}
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                    </form>
                    {chat.error && (
                      <p role="alert" className="text-red-500 text-[10px] mt-1">
                        {chat.error}
                        {chat.signedOut && (
                          <>
                            {" "}
                            <a href={loginHref()} className="font-medium underline underline-offset-2">
                              Se connecter
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {/* Ended → New chat button */}
                {!isActive && (
                  <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 text-center">
                    <button
                      type="button"
                      // The ended chat leaves the window: the start form shows.
                      onClick={chat.reset}
                      className="px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
                    >
                      Démarrer un nouveau chat
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Attachments of a message ────────────────────
// Not public: read through the relay, from a path of this very message.
// An attachment whose path is anything else is not rendered.
function ChatAttachments({ message }: { message: ChatMessage }) {
  const attachments = (message.attachments ?? []).flatMap((att) => {
    const relayUrl = attachmentUrl(att.path, "supportChat", message.id);
    return relayUrl ? [{ ...att, relayUrl }] : [];
  });
  if (attachments.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      {attachments.map((att) =>
        att.type === "image" ? (
          <a
            key={att.id}
            href={safeHref(att.relayUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg overflow-hidden max-w-[200px]"
          >
            <img
              src={safeSrc(att.relayUrl)}
              alt={att.name}
              className="w-full h-auto"
              loading="lazy"
            />
          </a>
        ) : (
          <a
            key={att.id}
            href={safeHref(att.relayUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
              message.is_own
                ? "bg-orange-600/50 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            <span className="truncate max-w-[120px]">
              {safeFilename(att.name)}
            </span>
          </a>
        )
      )}
    </div>
  );
}
