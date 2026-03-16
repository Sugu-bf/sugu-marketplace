import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/api/auth";
import { ConversationPageClient } from "./ConversationPageClient";

export const dynamic = "force-dynamic";

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

  const user = await getAuthUser();
  if (!user) {
    redirect(`/login?redirect=/messages/${conversationId}`);
  }

  return (
    <ConversationPageClient user={user} conversationId={conversationId} />
  );
}
