"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { startConversation } from "@/features/messaging/api";
import { useToast } from "@/features/toast/toast-store";
import { isApiError } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/** The server's words for a refusal; ours for anything else. */
function startErrorText(err: unknown): string {
  if (isApiError(err) && err.isClientError && err.message) return err.message;
  return "La conversation n'a pas pu s'ouvrir. Réessayez.";
}

interface ContactSellerButtonProps {
  storeId: string;
  productId?: string;
  /**
   * An order of the buyer's with this store: the conversation is about it
   * (type order_support), found again or reopened by the server.
   */
  orderId?: string;
  /** Where to come back after signing in (relative path). */
  loginRedirect?: string;
  variant?: "outline" | "primary" | "compact";
  label?: string;
  className?: string;
}

/**
 * ContactSellerButton — starts or resumes a conversation with a seller.
 *
 * Checks auth via cookie presence, redirects to login if not authenticated.
 * On success, navigates to /messages/{conversationId}. Any other failure is
 * said in a toast, and the buyer stays where they are.
 */
export function ContactSellerButton({
  storeId,
  productId,
  orderId,
  loginRedirect = "/messages",
  variant = "outline",
  label = "Contacter",
  className,
}: ContactSellerButtonProps) {
  const router = useRouter();
  const showError = useToast((s) => s.error);
  const [isPending, setIsPending] = useState(false);

  const handleClick = useCallback(async () => {
    setIsPending(true);
    try {
      const conversation = await startConversation(
        storeId,
        orderId,
        orderId ? "order_support" : undefined,
        productId,
      );
      router.push(`/messages/${conversation.id}`);
    } catch (err: unknown) {
      // 401 = not authenticated → redirect to login
      const status = err && typeof err === "object" && "status" in err
        ? (err as { status: number }).status
        : 0;
      if (status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      } else {
        showError(startErrorText(err));
      }
    } finally {
      setIsPending(false);
    }
  }, [storeId, orderId, productId, loginRedirect, router, showError]);

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
