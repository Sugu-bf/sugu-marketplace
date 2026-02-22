"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  startChat,
  getActiveChat,
  getMessages,
  sendMessage,
  markRead,
  endChat as endChatApi,
  type ChatConversation,
  type ChatMessage,
} from "./api";

// ── Chat Widget Hook ────────────────────────────
function useSupportChat() {
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // Fetch active chat on mount
  const loadActiveChat = useCallback(async () => {
    try {
      const chat = await getActiveChat();
      if (chat) {
        setConversation(chat);
        const result = await getMessages(chat.id);
        setMessages(result.messages.reverse());
      }
    } catch {
      // No active chat — that's fine
    }
  }, []);

  // Start a new chat
  const start = useCallback(async (subject?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const chat = await startChat(subject);
      setConversation(chat);
      const result = await getMessages(chat.id);
      setMessages(result.messages.reverse());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send message
  const send = useCallback(
    async (body: string, attachments?: File[]) => {
      if (!conversation) return;
      setError(null);
      try {
        const msg = await sendMessage(conversation.id, body, attachments);
        setMessages((prev) => [...prev, msg]);
      } catch (err: any) {
        setError(err.message);
      }
    },
    [conversation]
  );

  // End chat
  const end = useCallback(async () => {
    if (!conversation) return;
    try {
      await endChatApi(conversation.id);
      setConversation((prev) =>
        prev ? { ...prev, chat_status: "ended" } : null
      );
    } catch (err: any) {
      setError(err.message);
    }
  }, [conversation]);

  // Polling for new messages
  const poll = useCallback(async () => {
    if (!conversation) return;
    try {
      const result = await getMessages(conversation.id, undefined, 50);
      const newMsgs = result.messages.reverse();
      if (newMsgs.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const unique = newMsgs.filter((m) => !existingIds.has(m.id));
          return unique.length > 0 ? [...prev, ...unique] : prev;
        });
        // Mark read
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg && !lastMsg.is_own) {
          markRead(conversation.id, lastMsg.id).catch(() => {});
        }
      }
    } catch {
      /* ignore */
    }
  }, [conversation]);

  // Start/stop polling
  useEffect(() => {
    if (conversation && conversation.chat_status !== "ended") {
      pollingRef.current = setInterval(poll, 5000);
      return () => clearInterval(pollingRef.current);
    }
  }, [conversation, poll]);

  return {
    conversation,
    messages,
    isLoading,
    error,
    loadActiveChat,
    start,
    send,
    end,
  };
}

// ── Main Chat Widget Component ──────────────────
export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showStartForm, setShowStartForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const chat = useSupportChat();

  // Load active chat on open
  useEffect(() => {
    if (isOpen) {
      chat.loadActiveChat().then(() => {
        if (chat.conversation) {
          setShowStartForm(false);
        }
      });
    }
  }, [isOpen]);

  // When conversation is set, switch to messages view
  useEffect(() => {
    if (chat.conversation) {
      setShowStartForm(false);
    }
  }, [chat.conversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    await chat.start(subject || undefined);
    setSubject("");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const text = messageInput;
    setMessageInput("");
    await chat.send(text);
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
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ouvrir le chat support"
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
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
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
            {/* Start Form */}
            {showStartForm && !chat.conversation && (
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
                    value={subject}
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
                          {msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1.5">
                              {msg.attachments.map((att) =>
                                att.type === "image" ? (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block rounded-lg overflow-hidden max-w-[200px]"
                                  >
                                    <img
                                      src={att.thumb_url ?? att.url}
                                      alt={att.name}
                                      className="w-full h-auto"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : (
                                  <a
                                    key={att.id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs ${
                                      msg.is_own
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
                                      {att.name}
                                    </span>
                                  </a>
                                )
                              )}
                            </div>
                          )}
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
                        disabled={!messageInput.trim()}
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
                      <p className="text-red-500 text-[10px] mt-1">
                        {chat.error}
                      </p>
                    )}
                  </div>
                )}

                {/* Ended → New chat button */}
                {!isActive && (
                  <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 text-center">
                    <button
                      onClick={() => {
                        setShowStartForm(true);
                      }}
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
