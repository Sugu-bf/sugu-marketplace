"use client";

import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/messaging/types";
import { ReadReceipt } from "./ReadReceipt";
import { safeSrc } from "../security";

interface ConversationCardProps {
  conversation: Conversation;
  isActive: boolean;
  extraUnread?: number;
  onClick: (id: string) => void;
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 10) return "à l'instant";
  if (diffSec < 60) return `${diffSec}s`;
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 30) return `${diffDay}j`;
  if (diffMonth < 12) return `${diffMonth} mois`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getRoleBadge(conversation: Conversation): string | null {
  // Find the other participant's role
  const otherParticipant = conversation.participants?.find(
    (p) => p.type !== "customer"
  );
  if (!otherParticipant) return null;

  switch (otherParticipant.type) {
    case "seller":
      return "vendeur";
    case "agency":
      return "Agence de Livraison";
    case "admin":
      return "Support";
    case "courier":
      return "Livreur";
    default:
      return null;
  }
}

/**
 * ConversationCard — individual conversation preview in the list.
 */
export function ConversationCard({
  conversation,
  isActive,
  extraUnread = 0,
  onClick,
}: ConversationCardProps) {
  const store = conversation.store;
  const displayName = store?.name ?? conversation.participants?.[0]?.name ?? "Conversation";
  const avatarUrl = store?.logo_url ?? null;
  const isOnline = store?.is_online ?? false;
  const totalUnread = conversation.unread_count + extraUnread;
  const roleBadge = getRoleBadge(conversation);

  const initials = (displayName ?? "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const lastMessage = conversation.last_message;
  const isOwnLastMessage = lastMessage?.sender_type === "customer";

  return (
    <button
      type="button"
      onClick={() => onClick(conversation.id)}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 text-left transition-all duration-150",
        "border-b border-border-light",
        "hover:bg-primary-50/50",
        isActive && "bg-primary-50 border-l-2 border-l-primary"
      )}
      id={`conversation-${conversation.id}`}
    >
      {/* Avatar with online dot */}
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img
            src={safeSrc(avatarUrl)}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary">
            {initials}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-success border-2 border-white animate-pulse" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground truncate">
            {displayName}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
            {lastMessage
              ? formatRelativeTime(lastMessage.created_at)
              : formatRelativeTime(conversation.updated_at ?? conversation.created_at)}
          </span>
        </div>

        {/* Last message preview */}
        <div className="flex items-center gap-1 mt-0.5">
          {isOwnLastMessage && lastMessage && (
            <ReadReceipt status={conversation.unread_count === 0 ? "read" : "sent"} />
          )}
          <p className="text-xs text-muted-foreground truncate flex-1">
            {lastMessage?.body ?? "Démarrer la conversation..."}
          </p>
          {totalUnread > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>

        {/* Role badge */}
        {roleBadge && (
          <span className="text-xs text-muted-foreground mt-0.5 block">
            {roleBadge}
          </span>
        )}
      </div>
    </button>
  );
}
