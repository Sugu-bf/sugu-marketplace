"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  useMessages,
  useConversation,
  useMarkAsRead,
  useMessagingStore,
} from "../hooks";
import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { TypingIndicator } from "./TypingIndicator";
import { Composer } from "./Composer";
import { ChatRoomSkeleton } from "./ChatSkeleton";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/messaging/types";
import { safeSrc } from "../security";

interface ChatRoomProps {
  conversationId: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

function isSameDay(d1: string, d2: string): boolean {
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * ChatRoom — Panel 2: message area with header, messages, typing indicator, and composer.
 */
export function ChatRoom({
  conversationId,
  onBack,
  showBackButton = false,
}: ChatRoomProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const userIsScrolledUpRef = useRef(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const lastMarkedIdRef = useRef<string | null>(null);
  const scrollFrameRef = useRef<number | null>(null);

  const { data: conversation, isLoading: convLoading } = useConversation(conversationId);
  const {
    data: messagesData,
    isLoading: msgsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useMessages(conversationId);

  const markAsReadMut = useMarkAsRead();
  const typingUsers = useMessagingStore((s) => s.typingUsers);

  // Flatten messages from all pages
  // Flatten + reverse pages so messages appear in chronological order
  const allMessages = useMemo(() => {
    if (!messagesData?.pages) return [];
    return [...messagesData.pages].reverse().flatMap((page) => page.messages);
  }, [messagesData]);

  // Typing users for this conversation
  const typingNames = useMemo(() => {
    return Object.values(typingUsers)
      .filter((t) => t.conversationId === conversationId)
      .map((t) => t.userName);
  }, [typingUsers, conversationId]);

  // Store info
  const store = conversation?.store;
  const displayName = store?.name ?? conversation?.participants?.[0]?.name ?? "Chat";
  const avatarUrl = store?.logo_url ?? null;
  const isOnline = store?.is_online ?? false;

  // ─── Auto-scroll logic ──────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    if (!userIsScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length, scrollToBottom]);

  // Track if user scrolled up
  // rAF-throttled scroll handler — avoids > 60 calls/sec
  const handleScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (container) {
        const fromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
        userIsScrolledUpRef.current = fromBottom > 100;
      }
      scrollFrameRef.current = null;
    });
  }, []);

  // ─── Mark as read ────────────────────────────────────────────
  // Mark as read — guarded to prevent infinite loop
  useEffect(() => {
    if (!allMessages.length) return;
    const lastMsg = allMessages[allMessages.length - 1];
    if (!lastMsg || lastMsg.is_own) return;
    // Skip if already marked this message or mutation in-flight
    if (lastMsg.id === lastMarkedIdRef.current) return;
    if (markAsReadMut.isPending) return;

    lastMarkedIdRef.current = lastMsg.id;
    markAsReadMut.mutate({
      conversationId,
      lastReadMessageId: lastMsg.id,
    });
  }, [conversationId, allMessages.length]);

  // ─── Load more (scroll to top) ──────────────────────────────
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (convLoading || msgsLoading) {
    return <ChatRoomSkeleton />;
  }

  // Initials for avatar fallback
  const initials = (displayName ?? "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-light bg-white shadow-sm flex-shrink-0">
        {showBackButton && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <img
              src={safeSrc(avatarUrl)}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary">
              {initials}
            </div>
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-white" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground truncate">{displayName}</h3>
          <p
            className={cn(
              "text-xs",
              isOnline ? "text-success" : "text-muted-foreground"
            )}
          >
            {isOnline ? "● En ligne" : "Hors ligne"}
          </p>
        </div>
      </div>

      {/* ─── Messages ───────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide"
      >
        {/* Load more sentinel */}
        <div ref={loadMoreSentinelRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Loader2 size={20} className="animate-spin text-primary" />
          </div>
        )}

        {allMessages.map((message: Message, index: number) => {
          const prevMessage = index > 0 ? allMessages[index - 1] : null;
          const showDate = !prevMessage || !isSameDay(prevMessage.created_at, message.created_at);
          const showAvatar =
            !prevMessage ||
            prevMessage.sender_id !== message.sender_id ||
            showDate;

          return (
            <div key={message.id}>
              {showDate && <DateSeparator date={message.created_at} />}
              <MessageBubble
                message={message}
                showAvatar={showAvatar}
                avatarUrl={message.is_own ? null : avatarUrl}
              />
            </div>
          );
        })}

        {/* Typing indicator */}
        <TypingIndicator names={typingNames} />

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Composer ───────────────────────────────────────── */}
      <Composer conversationId={conversationId} />
    </div>
  );
}
