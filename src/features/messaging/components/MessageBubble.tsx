"use client";

import type { Message, ProductCardMetadata } from "@/lib/messaging/types";
import { ReadReceipt } from "./ReadReceipt";
import { ProductCardBubble } from "./ProductCardBubble";
import { SystemEventBubble } from "./SystemEventBubble";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { X, Paperclip, ShieldCheck } from "lucide-react";
import { safeSrc, safeHref, safeFilename, attachmentUrl } from "../security";
import { messageMaskedKinds } from "../contact-policy";

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  avatarUrl?: string | null;
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
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

  // Attachments are read through the relay, from a path of this very
  // message; one whose path is anything else is not rendered.
  const attachments = (message.attachments ?? []).flatMap((att) => {
    const relayUrl = attachmentUrl(att.path, "conversation", message.id);
    return relayUrl ? [{ ...att, relayUrl }] : [];
  });
  const images = attachments.filter((att) => att.type === "image");
  const files = attachments.filter((att) => att.type !== "image");
  const hasBody = !!message.body?.trim();

  // The server took a number, an e-mail or a link out of what the buyer wrote.
  const contactsMasked = isOwn && messageMaskedKinds(message).length > 0;

  // Avatar initials fallback
  const initials = (message.sender_name ?? "")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
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
            {hasBody && message.message_type !== "product_card" && (
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

            {/* Attachments (text and image messages), read through the relay */}
            {message.message_type !== "product_card" && attachments.length > 0 && (
              <div className={cn("space-y-1.5", hasBody && "mt-2")}>
                {images.length > 0 && (
                  <div className={cn("grid gap-1.5", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                    {images.map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => setLightboxUrl(att.relayUrl)}
                        aria-label={`Agrandir ${safeFilename(att.name)}`}
                        className="block rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={safeSrc(att.relayUrl)}
                          alt={att.name}
                          className="w-full h-auto max-h-48 object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
                {files.map((att) => (
                  <a
                    key={att.id}
                    href={safeHref(att.relayUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-1.5 text-xs underline",
                      isOwn
                        ? "text-white/80 hover:text-white"
                        : "text-primary hover:text-primary-dark"
                    )}
                  >
                    <Paperclip size={12} className="flex-shrink-0" />
                    <span className="truncate">{safeFilename(att.name)}</span>
                  </a>
                ))}
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
            {contactsMasked && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"
                title="Un numéro, un e-mail ou un lien externe n'a pas été transmis."
              >
                <ShieldCheck size={10} />
                Coordonnées masquées ·
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.created_at)}
            </span>
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
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightboxUrl(null)}
            aria-label="Fermer"
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
