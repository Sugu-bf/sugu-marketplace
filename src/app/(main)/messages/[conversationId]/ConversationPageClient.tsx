"use client";

import { useEffect } from "react";
import type { AuthUser } from "@/lib/api/auth";
import { MessagingPage } from "@/features/messaging/components/MessagingPage";
import { useMessagingStore } from "@/features/messaging/hooks";

interface ConversationPageClientProps {
  user: AuthUser;
  conversationId: string;
}

/**
 * Client wrapper for /messages/[conversationId] — sets the initial active conversation
 * in the Zustand store before rendering MessagingPage.
 */
export function ConversationPageClient({
  user,
  conversationId,
}: ConversationPageClientProps) {
  const setActiveConversation = useMessagingStore(
    (s) => s.setActiveConversation
  );

  useEffect(() => {
    setActiveConversation(conversationId);
  }, [conversationId, setActiveConversation]);

  return <MessagingPage user={user} />;
}
