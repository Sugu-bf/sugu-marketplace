"use client";

/**
 * Messaging hooks — React Query + Zustand store for messaging state.
 */

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { create } from "zustand";
import {
  fetchConversations,
  fetchConversation,
  fetchMessages,
  sendMessage,
  sendProductCard,
  markAsRead,
  sendTyping,
  fetchPresence,
  fetchRecommendedProducts,
  startConversation,
  reportMessage,
} from "./api";

// ─── Query Keys ───────────────────────────────────────────────

export const messagingKeys = {
  all: ["messaging"] as const,
  conversations: (filters?: Record<string, unknown>) =>
    ["messaging", "conversations", filters ?? {}] as const,
  conversation: (id: string) =>
    ["messaging", "conversation", id] as const,
  messages: (conversationId: string) =>
    ["messaging", "messages", conversationId] as const,
  presence: (conversationId: string) =>
    ["messaging", "presence", conversationId] as const,
  recommendedProducts: (conversationId: string) =>
    ["messaging", "recommended-products", conversationId] as const,
};

// ─── Zustand Store ─────────────────────────────────────────────

interface TypingUserEntry {
  conversationId: string;
  userName: string;
  expiresAt: number;
}

interface MessagingStore {
  // Active conversation (desktop)
  activeConversationId: string | null;
  setActiveConversation: (id: string | null) => void;

  // Typing states (received from other users)
  typingUsers: Record<string, TypingUserEntry>;
  addTypingUser: (
    conversationId: string,
    userId: string,
    userName: string
  ) => void;
  removeTypingUser: (userId: string) => void;

  // Unread counts (real-time updates)
  unreadUpdates: Record<string, number>;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;

  // Mobile view state
  mobileView: "list" | "chat";
  setMobileView: (view: "list" | "chat") => void;
}

export const useMessagingStore = create<MessagingStore>((set) => ({
  activeConversationId: null,
  setActiveConversation: (id) =>
    set({ activeConversationId: id, mobileView: id ? "chat" : "list" }),

  typingUsers: {},
  addTypingUser: (conversationId, userId, userName) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: {
          conversationId,
          userName,
          expiresAt: Date.now() + 3000,
        },
      },
    })),
  removeTypingUser: (userId) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.typingUsers;
      return { typingUsers: rest };
    }),

  unreadUpdates: {},
  incrementUnread: (conversationId) =>
    set((state) => ({
      unreadUpdates: {
        ...state.unreadUpdates,
        [conversationId]:
          (state.unreadUpdates[conversationId] ?? 0) + 1,
      },
    })),
  clearUnread: (conversationId) =>
    set((state) => {
      const { [conversationId]: _, ...rest } = state.unreadUpdates;
      return { unreadUpdates: rest };
    }),

  mobileView: "list",
  setMobileView: (view) => set({ mobileView: view }),
}));

// ─── React Query Hooks ─────────────────────────────────────────

export function useConversations(filters?: {
  status?: string;
  q?: string;
}) {
  return useInfiniteQuery({
    queryKey: messagingKeys.conversations(filters),
    queryFn: ({ pageParam }) =>
      fetchConversations({
        ...filters,
        cursor: pageParam as string | undefined,
        per_page: 20,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.has_more ? lastPage.meta.next_cursor ?? undefined : undefined,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: messagingKeys.conversation(id!),
    queryFn: () => fetchConversation(id!),
    enabled: !!id,
  });
}

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: messagingKeys.messages(conversationId!),
    queryFn: ({ pageParam }) =>
      fetchMessages(conversationId!, {
        before_id: pageParam as string | undefined,
        limit: 30,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_more || lastPage.messages.length === 0) return undefined;
      return lastPage.messages[lastPage.messages.length - 1]?.id;
    },
    enabled: !!conversationId,
  });
}

export function usePresence(conversationId: string | null) {
  return useQuery({
    queryKey: messagingKeys.presence(conversationId!),
    queryFn: () => fetchPresence(conversationId!),
    enabled: !!conversationId,
    refetchInterval: 60_000, // Re-check every 60s
  });
}

export function useRecommendedProducts(conversationId: string | null) {
  return useQuery({
    queryKey: messagingKeys.recommendedProducts(conversationId!),
    queryFn: () => fetchRecommendedProducts(conversationId!),
    enabled: !!conversationId,
    staleTime: 5 * 60_000, // 5 minutes
  });
}

// ─── Mutations ──────────────────────────────────────────────────

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      body,
      attachments,
    }: {
      conversationId: string;
      body: string;
      attachments?: File[];
    }) => sendMessage(conversationId, body, attachments),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: messagingKeys.messages(variables.conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: messagingKeys.conversations(),
      });
    },
  });
}

export function useSendProductCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      productId,
      body,
    }: {
      conversationId: string;
      productId: string;
      body?: string;
    }) => sendProductCard(conversationId, productId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: messagingKeys.messages(variables.conversationId),
      });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      lastReadMessageId,
    }: {
      conversationId: string;
      lastReadMessageId: string;
    }) => markAsRead(conversationId, lastReadMessageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: messagingKeys.conversations(),
      });
      useMessagingStore.getState().clearUnread(variables.conversationId);
    },
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      orderId,
      type,
    }: {
      storeId: string;
      orderId?: string;
      type?: string;
    }) => startConversation(storeId, orderId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: messagingKeys.conversations(),
      });
    },
  });
}

export function useReportMessage() {
  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
      reasonCode,
      note,
    }: {
      conversationId: string;
      messageId: string;
      reasonCode: string;
      note?: string;
    }) => reportMessage(conversationId, messageId, reasonCode, note),
  });
}

// ─── Helper: Send typing (for useTypingIndicator) ───────────────

export { sendTyping };
