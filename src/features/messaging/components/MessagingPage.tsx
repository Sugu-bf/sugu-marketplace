"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMessagingEvents } from "@/lib/messaging/hooks/useMessagingEvents";
import type { AuthUser } from "@/lib/api/auth";
import type {
  MessageCreatedPayload,
  MessageReadPayload,
  UserTypingPayload,
} from "@/lib/messaging/types";
import {
  useMessagingStore,
  useRealtimeFallback,
  messagingKeys,
} from "../hooks";
import { ConversationList } from "./ConversationList";
import { ChatRoom } from "./ChatRoom";
import { ContactPanel } from "./ContactPanel";
import { MessageSquare } from "lucide-react";

interface MessagingPageProps {
  user: AuthUser;
}

/**
 * MessagingPage — main orchestrator for the 3-panel chat layout.
 *
 * Mobile:  Shows ConversationList OR ChatRoom (toggle)
 * Desktop: Shows ConversationList | ChatRoom | ContactPanel side-by-side
 *
 * Handles real-time events via Echo/Reverb on the user's private channel,
 * and reads the list and the open conversation again while they cannot come.
 */
export function MessagingPage({ user }: MessagingPageProps) {
  const queryClient = useQueryClient();

  const activeConversationId = useMessagingStore((s) => s.activeConversationId);
  const setActiveConversation = useMessagingStore((s) => s.setActiveConversation);
  const mobileView = useMessagingStore((s) => s.mobileView);
  const setMobileView = useMessagingStore((s) => s.setMobileView);
  const addTypingUser = useMessagingStore((s) => s.addTypingUser);
  const removeTypingUser = useMessagingStore((s) => s.removeTypingUser);

  // Ref to avoid stale closure in real-time callbacks
  const activeConvRef = useRef(activeConversationId);
  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);

  // ─── Real-time events ─────────────────────────────────────

  const handleMessageCreated = useCallback(
    (payload: MessageCreatedPayload) => {
      // The list is read again: its preview and its unread counts are the
      // server's, already counting this message. Adding one here counted it
      // twice.
      queryClient.invalidateQueries({
        queryKey: messagingKeys.conversations(),
      });

      // The open conversation reads its messages again (and marks them read).
      if (payload.conversation_id === activeConvRef.current) {
        queryClient.invalidateQueries({
          queryKey: messagingKeys.messages(payload.conversation_id),
        });
      }
    },
    [queryClient]
  );

  const handleMessageRead = useCallback(
    (payload: MessageReadPayload) => {
      // RT4: Skip own read receipts — no need to refetch for our own action
      if (payload.user_id === user.id) return;

      const currentActiveId = activeConvRef.current;
      if (payload.conversation_id === currentActiveId) {
        queryClient.invalidateQueries({
          queryKey: messagingKeys.messages(payload.conversation_id),
        });
      }
      queryClient.invalidateQueries({
        queryKey: messagingKeys.conversations(),
      });
    },
    [user.id, queryClient]
  );

  const handleUserTyping = useCallback(
    (payload: UserTypingPayload) => {
      if (payload.user_id === user.id) return; // Ignore own typing

      addTypingUser(payload.conversation_id, payload.user_id, payload.user_name);

      // Auto-dismiss after 3s
      setTimeout(() => {
        removeTypingUser(payload.user_id);
      }, 3000);
    },
    [user.id, addTypingUser, removeTypingUser]
  );

  // Subscribe to user's messaging channel
  const isLive = useMessagingEvents({
    channelName: `messaging.user.${user.id}`,
    onMessageCreated: handleMessageCreated,
    onMessageRead: handleMessageRead,
    onUserTyping: handleUserTyping,
  });

  // Without realtime, the page reads again by itself.
  useRealtimeFallback(isLive, activeConversationId);

  // ─── Conversation selection ─────────────────────────────────

  const handleSelectConversation = useCallback(
    (id: string) => {
      setActiveConversation(id);
    },
    [setActiveConversation]
  );

  const handleBack = useCallback(() => {
    setActiveConversation(null);
    setMobileView("list");
  }, [setActiveConversation, setMobileView]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* ═══ Desktop Layout (lg+): 3 panels ═══ */}

      {/* Panel 1 — Conversation List */}
      <div className="hidden lg:flex lg:w-[320px] xl:w-[350px] flex-shrink-0 border-r border-border-light">
        <div className="w-full">
          <ConversationList
            onSelectConversation={handleSelectConversation}
            activeConversationId={activeConversationId}
          />
        </div>
      </div>

      {/* Panel 2 — Chat Room */}
      <div className="hidden lg:flex flex-1 min-w-0">
        {activeConversationId ? (
          <div className="w-full">
            <ChatRoom conversationId={activeConversationId} />
          </div>
        ) : (
          <div className="w-full flex items-center justify-center bg-muted/20">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                <MessageSquare size={28} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Sélectionnez une conversation pour commencer
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Panel 3 — Contact Panel */}
      {activeConversationId && (
        <div className="hidden xl:flex xl:w-[280px] flex-shrink-0">
          <div className="w-full">
            <ContactPanel conversationId={activeConversationId} />
          </div>
        </div>
      )}

      {/* ═══ Mobile Layout (<lg): single panel ═══ */}
      <div className="flex lg:hidden w-full">
        {mobileView === "list" || !activeConversationId ? (
          <div className="w-full">
            <ConversationList
              onSelectConversation={handleSelectConversation}
              activeConversationId={null}
            />
          </div>
        ) : (
          <div className="w-full">
            <ChatRoom
              conversationId={activeConversationId}
              showBackButton
              onBack={handleBack}
            />
          </div>
        )}
      </div>
    </div>
  );
}
