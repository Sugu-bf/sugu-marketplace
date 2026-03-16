/**
 * Messaging API Client — typed functions for all customer messaging endpoints.
 */

import { api } from "@/lib/api/client";
import { meUrl, buildApiUrl } from "@/lib/api/endpoints";
import type { Conversation, Message, PresenceInfo } from "@/lib/messaging/types";

// ── Response envelope ──────────────────────────────────────

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

interface CursorMeta {
  has_more: boolean;
  next_cursor: string | null;
}

// ── Recommended Product ────────────────────────────────────

export interface RecommendedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_price: number | null;
  currency: string;
  thumbnail: string | null;
  in_stock: boolean;
}

// ── Conversations ──────────────────────────────────────────

export async function fetchConversations(params?: {
  status?: string;
  q?: string;
  per_page?: number;
  cursor?: string;
}): Promise<{ data: Conversation[]; meta: CursorMeta }> {
  const { data } = await api.get<
    ApiEnvelope<Conversation[]> & { meta: CursorMeta }
  >(
    meUrl("conversations", {
      per_page: params?.per_page ?? 20,
      ...(params?.status ? { status: params.status } : {}),
      ...(params?.q ? { q: params.q } : {}),
      ...(params?.cursor ? { cursor: params.cursor } : {}),
    })
  );
  return { data: data.data, meta: data.meta };
}

export async function startConversation(
  storeId: string,
  orderId?: string,
  type?: string,
  productId?: string,
): Promise<Conversation> {
  const { data } = await api.post<ApiEnvelope<Conversation>>(
    meUrl("conversations/start"),
    {
      body: {
        store_id: storeId,
        ...(orderId ? { order_id: orderId } : {}),
        ...(type ? { type } : {}),
        ...(productId ? { product_id: productId } : {}),
      },
    }
  );
  return data.data;
}

export async function fetchConversation(
  conversationId: string
): Promise<Conversation> {
  const { data } = await api.get<ApiEnvelope<Conversation>>(
    meUrl(`conversations/${conversationId}`)
  );
  return data.data;
}

// ── Messages ───────────────────────────────────────────────

export async function fetchMessages(
  conversationId: string,
  params?: { before_id?: string; limit?: number }
): Promise<{ messages: Message[]; has_more: boolean }> {
  const { data } = await api.get<
    ApiEnvelope<{ messages: Message[]; has_more: boolean }>
  >(
    meUrl(`conversations/${conversationId}/messages`, {
      ...(params?.before_id ? { before_id: params.before_id } : {}),
      limit: params?.limit ?? 30,
    })
  );
  return { messages: data.data.messages, has_more: data.data.has_more };
}

export async function sendMessage(
  conversationId: string,
  body: string,
  attachments?: File[]
): Promise<Message> {
  if (attachments && attachments.length > 0) {
    const formData = new FormData();
    formData.append("body", body);
    for (const file of attachments) {
      formData.append("attachments[]", file);
    }
    const { data } = await api.post<ApiEnvelope<Message>>(
      meUrl(`conversations/${conversationId}/messages`),
      { body: formData }
    );
    return data.data;
  }

  const { data } = await api.post<ApiEnvelope<Message>>(
    meUrl(`conversations/${conversationId}/messages`),
    { body: { body } }
  );
  return data.data;
}

export async function sendProductCard(
  conversationId: string,
  productId: string,
  body?: string
): Promise<Message> {
  const { data } = await api.post<ApiEnvelope<Message>>(
    meUrl(`conversations/${conversationId}/product-card`),
    { body: { product_id: productId, ...(body ? { body } : {}) } }
  );
  return data.data;
}

// ── Actions ────────────────────────────────────────────────

export async function markAsRead(
  conversationId: string,
  lastReadMessageId: string
): Promise<void> {
  await api.post(meUrl(`conversations/${conversationId}/read`), {
    body: { last_read_message_id: lastReadMessageId },
  });
}

export async function sendTyping(conversationId: string): Promise<void> {
  await api.post(meUrl(`conversations/${conversationId}/typing`));
}

export async function fetchPresence(
  conversationId: string
): Promise<PresenceInfo[]> {
  const { data } = await api.get<ApiEnvelope<PresenceInfo[]>>(
    meUrl(`conversations/${conversationId}/presence`)
  );
  return data.data;
}

export async function reportMessage(
  conversationId: string,
  messageId: string,
  reasonCode: string,
  note?: string
): Promise<{ report_id: string }> {
  const { data } = await api.post<ApiEnvelope<{ report_id: string }>>(
    meUrl(`conversations/${conversationId}/messages/${messageId}/report`),
    { body: { reason_code: reasonCode, ...(note ? { note } : {}) } }
  );
  return data.data;
}

// ── Products ───────────────────────────────────────────────

export async function fetchRecommendedProducts(
  conversationId: string
): Promise<RecommendedProduct[]> {
  const { data } = await api.get<ApiEnvelope<RecommendedProduct[]>>(
    buildApiUrl(`/api/v1/conversations/${conversationId}/recommended-products`)
  );
  return data.data;
}
