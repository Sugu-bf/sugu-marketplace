import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/api/auth";
import { ConversationPageClient } from "./ConversationPageClient";

export const dynamic = "force-dynamic";

/** A conversation is named by a ULID; anything else names none. */
const CONVERSATION_ID = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

/**
 * Mobile chat room page — /messages/[conversationId]
 *
 * On mobile: displays the ChatRoom fullscreen.
 * On desktop: redirects to /messages with the conversation selected.
 */
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  if (!CONVERSATION_ID.test(conversationId)) {
    notFound();
  }

  const user = await getAuthUser();
  if (!user) {
    redirect(`/login?redirect=/messages/${conversationId}`);
  }

  return (
    <ConversationPageClient user={user} conversationId={conversationId} />
  );
}
