"use client";

import type { Message, ProductCardMetadata } from "@/lib/messaging/types";
import { ReadReceipt } from "./ReadReceipt";
import { ProductCardBubble } from "./ProductCardBubble";
import { SystemEventBubble } from "./SystemEventBubble";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { X } from "lucide-react";
import { safeSrc, safeHref, safeFilename } from "../security";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  avatarUrl?: string | null;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * MessageBubble — renders a single message based on its type.
 */
export function MessageBubble({
  message,
  showAvatar = true,
  avatarUrl,
}: MessageBubbleProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // System events — centered, no bubble
  if (message.message_type === "system_event") {
    return <SystemEventBubble body={message.body} />;
  }

  const isOwn = message.is_own;

  // Avatar initials fallback
  const initials = message.sender_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div
        className={cn(
          "flex gap-2 group",
          isOwn ? "justify-end" : "justify-start",
          "px-2"
        )}
      >
        {/* Avatar (only for received messages) */}
        {!isOwn && showAvatar && (
          <div className="flex-shrink-0 mt-auto">
            {avatarUrl ? (
              <img
                src={safeSrc(avatarUrl)}
                alt={message.sender_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-[10px] font-bold text-primary">
                {initials}
              </div>
            )}
          </div>
        )}
        {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

        {/* Bubble content */}
        <div className={cn("max-w-[75%] min-w-[80px]", isOwn && "order-first")}>
          {/* Sender name for received messages */}
          {!isOwn && showAvatar && (
            <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">
              {message.sender_name}
            </p>
          )}

          <div
            className={cn(
              "px-3.5 py-2.5 relative",
              isOwn
                ? "bg-primary text-white rounded-2xl rounded-tr-sm"
                : "bg-white border border-border-light text-foreground rounded-2xl rounded-tl-sm"
            )}
          >
            {/* Text body */}
            {message.body && message.message_type !== "product_card" && (
              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                {message.body}
              </p>
            )}

            {/* Product card */}
            {message.message_type === "product_card" && (
              <div className="space-y-2">
                {message.body && (
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.body}
                  </p>
                )}
                {message.metadata && "product_name" in message.metadata && (
                  <ProductCardBubble
                    metadata={message.metadata as ProductCardMetadata}
                    isOwn={isOwn}
                  />
                )}
              </div>
            )}

            {/* Image type */}
            {message.message_type === "image" && message.attachments.length > 0 && (
              <div className="space-y-1.5">
                {message.body && (
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.body}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-1.5">
                  {message.attachments
                    .filter((a) => a.type === "image")
                    .map((attachment) => (
                      <button
                        key={attachment.id}
                        onClick={() => setLightboxUrl(safeSrc(attachment.url))}
                        className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={safeSrc(attachment.thumb_url ?? attachment.url)}
                          alt={attachment.name}
                          className="w-full h-auto max-h-40 object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Text with attachments */}
            {message.message_type === "text" &&
              message.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {message.attachments.map((att) =>
                    att.type === "image" ? (
                      <button
                        key={att.id}
                        onClick={() => setLightboxUrl(safeSrc(att.url))}
                        className="rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity block"
                      >
                        <img
                          src={safeSrc(att.thumb_url ?? att.url)}
                          alt={att.name}
                          className="max-w-full max-h-48 rounded-lg"
                          loading="lazy"
                        />
                      </button>
                    ) : (
                      <a
                        key={att.id}
                        href={safeHref(att.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "block text-xs underline",
                          isOwn
                            ? "text-white/80 hover:text-white"
                            : "text-primary hover:text-primary-dark"
                        )}
                      >
                        📎 {safeFilename(att.name)}
                      </a>
                    )
                  )}
                </div>
              )}
          </div>

          {/* Timestamp + Read receipt */}
          <div
            className={cn(
              "flex items-center gap-1 mt-0.5 px-1",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
            {isOwn && (
              <ReadReceipt status={message.is_flagged ? "read" : "sent"} />
            )}
          </div>
        </div>

        {/* Own avatar */}
        {isOwn && showAvatar && (
          <div className="flex-shrink-0 mt-auto">
            {avatarUrl ? (
              <img
                src={safeSrc(avatarUrl)}
                alt="Vous"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                {initials}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={24} />
          </button>
          <img
            src={safeSrc(lightboxUrl)}
            alt="Image agrandie"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
}
