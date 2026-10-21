"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui";
import { openSupportChat } from "./launcher";

/**
 * Opens the support chat widget of the page. Rendered only on a page that
 * renders <SupportChatWidget />.
 */
export function OpenSupportChatButton({ className }: { className?: string }) {
  return (
    <Button type="button" variant="primary" size="md" className={className} onClick={() => openSupportChat()}>
      <MessageCircle size={16} />
      Ouvrir le chat
    </Button>
  );
}
