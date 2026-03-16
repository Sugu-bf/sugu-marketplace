"use client";

import { useState, useMemo } from "react";
import { useConversations, useMessagingStore } from "../hooks";
import { ConversationCard } from "./ConversationCard";
import { EmptyState } from "./EmptyState";
import { ConversationListSkeleton } from "./ChatSkeleton";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useCallback } from "react";

interface ConversationListProps {
  onSelectConversation: (id: string) => void;
  activeConversationId: string | null;
}

/**
 * ConversationList — Panel 1: list of conversations with tabs & infinite scroll.
 */
export function ConversationList({
  onSelectConversation,
  activeConversationId,
}: ConversationListProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const unreadUpdates = useMessagingStore((s) => s.unreadUpdates);

  // Debounce search input (300ms)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(trimmed), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Stable filter object for React Query key
  const queryFilters = useMemo(() => ({
    ...(filter === "unread" ? { status: "unread" as const } : {}),
    ...(debouncedQuery ? { q: debouncedQuery } : {}),
  }), [filter, debouncedQuery]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useConversations(queryFilters);

  // Flatten pages into conversations
  const conversations = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data]
  );

  // Memoized counts
  const { totalCount, unreadCount } = useMemo(() => ({
    totalCount: conversations.length,
    unreadCount: conversations.filter(
      (c) => c.unread_count > 0 || (unreadUpdates[c.id] ?? 0) > 0
    ).length,
  }), [conversations, unreadUpdates]);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.1,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3 border-b border-border-light">
        <h2 className="text-lg font-bold text-foreground">Messages</h2>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
              filter === "all"
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Tous ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
              filter === "unread"
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Non lus ({unreadCount})
          </button>
        </div>

        {/* Search (optional) */}
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-full border border-border bg-muted/30 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                extraUnread={unreadUpdates[conversation.id] ?? 0}
                onClick={onSelectConversation}
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
