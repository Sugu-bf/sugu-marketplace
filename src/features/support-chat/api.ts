/**
 * Support Chat API client for the customer-facing marketplace.
 * Communicates with the Laravel backend via Sanctum-authenticated requests.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

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
  sender_id: string;
  sender_type: "customer" | "admin" | "seller";
  sender_name: string;
  body: string;
  is_own: boolean;
  attachments: {
    id: number;
    type: "image" | "file";
    url: string;
    thumb_url: string | null;
    name: string;
    size: number;
    mime_type: string;
  }[];
  created_at: string;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}/v1${path}`, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.message ?? `API error ${res.status}: ${res.statusText}`
    );
  }

  return res.json();
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
    { method: "POST", body: JSON.stringify(body) }
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
    meta: any;
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
 * Send a message in a support chat.
 */
export async function sendMessage(
  conversationId: string,
  body: string,
  attachments?: File[]
): Promise<ChatMessage> {
  const formData = new FormData();
  formData.append("body", body);

  if (attachments) {
    attachments.forEach((f) => formData.append("attachments[]", f));
  }

  const res = await apiFetch<{ success: boolean; data: ChatMessage }>(
    `/me/support-chat/${conversationId}/messages`,
    { method: "POST", body: formData }
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
    body: JSON.stringify({ last_read_message_id: lastReadMessageId }),
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
