"use client";

import { MessageSquare } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

/**
 * EmptyState — large icon + message for empty conversation list.
 */
export function EmptyState({
  title = "Aucune conversation",
  subtitle = "Contactez un vendeur pour démarrer une conversation",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-slide-up">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare size={36} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[260px]">{subtitle}</p>
    </div>
  );
}
