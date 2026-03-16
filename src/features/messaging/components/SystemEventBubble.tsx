"use client";

import { Info } from "lucide-react";

interface SystemEventBubbleProps {
  body: string;
}

/**
 * SystemEventBubble — centered, no bubble, gray text with info icon.
 */
export function SystemEventBubble({ body }: SystemEventBubbleProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-2">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-light bg-muted/50 text-xs text-muted-foreground">
        <Info size={12} className="flex-shrink-0" />
        <span>{body}</span>
      </div>
    </div>
  );
}
