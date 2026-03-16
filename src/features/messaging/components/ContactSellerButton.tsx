"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { startConversation } from "@/features/messaging/api";
import { cn } from "@/lib/utils";

interface ContactSellerButtonProps {
  storeId: string;
  productId?: string;
  variant?: "outline" | "primary" | "compact";
  label?: string;
  className?: string;
}

/**
 * ContactSellerButton — starts or resumes a conversation with a seller.
 *
 * Checks auth via cookie presence, redirects to login if not authenticated.
 * On success, navigates to /messages/{conversationId}.
 */
export function ContactSellerButton({
  storeId,
  productId,
  variant = "outline",
  label = "Contacter",
  className,
}: ContactSellerButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleClick = useCallback(async () => {
    setIsPending(true);
    try {
      const conversation = await startConversation(storeId, undefined, undefined, productId);
      router.push(`/messages/${conversation.id}`);
    } catch (err: unknown) {
      // 401 = not authenticated → redirect to login
      const status = err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 0;
      if (status === 401) {
        router.push("/login?redirect=/messages");
      } else {
        router.push("/messages");
      }
    } finally {
      setIsPending(false);
    }
  }, [storeId, productId, router]);

  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white",
          "transition-all duration-200 hover:bg-primary-dark active:scale-95 shadow-sm",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {isPending ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <MessageCircle size={16} />
        )}
        {isPending ? "Connexion..." : label}
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium text-primary",
          "hover:text-primary-dark transition-colors underline underline-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <MessageCircle size={14} />
        )}
        {label}
      </button>
    );
  }

  // Outline (default)
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border px-4 sm:px-5 py-2 text-sm font-medium text-foreground",
        "transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <MessageCircle size={16} />
      )}
      {isPending ? "Connexion..." : label}
    </button>
  );
}
