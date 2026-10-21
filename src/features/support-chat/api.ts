/**
 * Support Chat API client for the customer-facing marketplace.
 * Browser calls go through the same-origin BFF so the Sanctum token remains
 * HttpOnly and is injected server-side.
 */

import { api } from "@/lib/api/client";
import { buildApiUrl } from "@/lib/api/endpoints";

export interface ChatConversation {
  id: string;
  chat_status: "waiting_agent" | "active" | "ended";
  chat_status_label: string;
  status: string;
  subject: string | null;
  order_id: string | null;
  assigned_agent: { id: string; name: string } | null;
  last_message: {
    id: string;
    body: string;
    sender_type: string;
    created_at: string;
  } | null;
  last_message_id: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  /** The identifier the sender chose for it, so a send can be replayed. */
  client_message_id?: string | null;
  sender_id: string;
  sender_type: "customer" | "admin" | "seller";
  sender_name: string;
  body: string;
  is_own: boolean;
  /**
   * Not public: read through the API at `path`
   * (`me/support-chat/{c}/messages/{m}/attachments/{media}`), by way of the
   * relay — see attachmentUrl() in features/messaging/security.ts.
   */
  attachments: {
    id: number;
    type: "image" | "file";
    path: string;
    name: string;
    size: number;
    mime_type: string;
  }[];
  created_at: string;
}

// ── Realtime (private channel support.chat.customer.{userId}) ──

/** `.support.message.created` — a message was written in a support chat. */
export interface SupportMessageCreatedPayload {
  message_id: string;
  conversation_id: string;
  sender_type: string;
  sender_id: string | null;
  sender_name: string;
  body_snippet: string;
  created_at: string;
}

/** `.support.status.updated` — waiting → active → ended, or a new agent. */
export interface SupportStatusUpdatedPayload {
  conversation_id: string;
  chat_status: ChatConversation["chat_status"] | null;
  status: string;
  assigned_admin_id: string | null;
}

/** `.support.typing` — an agent is typing (sent to the customer only). */
export interface SupportTypingPayload {
  conversation_id: string;
  user_id: string;
  user_name: string;
  participant_type: string;
}

type SupportChatRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  /** Retries of a POST on a network failure: only for a replayable send. */
  retries?: number;
};

async function apiFetch<T>(path: string, options: SupportChatRequestOptions = {}): Promise<T> {
  const url = buildApiUrl(`/api/v1${path}`);

  if (options.method === "POST") {
    const { data } = await api.post<T>(url, { body: options.body, retries: options.retries });
    return data;
  }

  const { data } = await api.get<T>(url);
  return data;
}

/**
 * Start or reclaim a support chat.
 */
export async function startChat(
  subject?: string,
  orderId?: string
): Promise<ChatConversation> {
  const body: Record<string, string> = {};
  if (subject) body.subject = subject;
  if (orderId) body.order_id = orderId;

  const res = await apiFetch<{ success: boolean; data: ChatConversation }>(
    "/me/support-chat/start",
    { method: "POST", body }
  );
  return res.data;
}

/**
 * Get the currently active support chat (if any).
 */
export async function getActiveChat(): Promise<ChatConversation | null> {
  const res = await apiFetch<{ success: boolean; data: ChatConversation | null }>(
    "/me/support-chat/active"
  );
  return res.data;
}

/**
 * Get chat history.
 */
export async function getChatHistory(
  page = 1,
  perPage = 20
): Promise<{ data: ChatConversation[]; meta: { total: number } }> {
  const res = await apiFetch<{
    success: boolean;
    data: ChatConversation[];
    meta: { total: number };
  }>(`/me/support-chat/history?page=${page}&per_page=${perPage}`);
  return { data: res.data, meta: res.meta };
}

/**
 * Get messages for a conversation (seek pagination).
 */
export async function getMessages(
  conversationId: string,
  beforeId?: string,
  limit = 30
): Promise<{ messages: ChatMessage[]; has_more: boolean }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (beforeId) params.set("before_id", beforeId);

  const res = await apiFetch<{
    success: boolean;
    data: { messages: ChatMessage[]; has_more: boolean };
  }>(`/me/support-chat/${conversationId}/messages?${params}`);
  return res.data;
}

/**
 * Send a message in a support chat, with its `client_message_id`: sent
 * again with it, the same message is answered (HTTP 200), written once.
 * That makes one retry on a network failure safe.
 */
export async function sendMessage(
  conversationId: string,
  body: string,
  clientMessageId: string,
  attachments?: File[]
): Promise<ChatMessage> {
  const formData = new FormData();
  formData.append("body", body);
  formData.append("client_message_id", clientMessageId);

  if (attachments) {
    attachments.forEach((f) => formData.append("attachments[]", f));
  }

  const res = await apiFetch<{ success: boolean; data: ChatMessage }>(
    `/me/support-chat/${conversationId}/messages`,
    { method: "POST", body: formData, retries: 1 }
  );
  return res.data;
}

/**
 * Mark messages as read.
 */
export async function markRead(
  conversationId: string,
  lastReadMessageId: string
): Promise<void> {
  await apiFetch(`/me/support-chat/${conversationId}/read`, {
    method: "POST",
    body: { last_read_message_id: lastReadMessageId },
  });
}

/**
 * End a support chat.
 */
export async function endChat(conversationId: string): Promise<void> {
  await apiFetch(`/me/support-chat/${conversationId}/end`, {
    method: "POST",
  });
}
