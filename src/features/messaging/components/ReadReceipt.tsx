"use client";

import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadReceiptProps {
  status: "sent" | "read";
  className?: string;
}

/**
 * ReadReceipt — shows ✓ (sent) or ✓✓ blue (read).
 */
export function ReadReceipt({ status, className }: ReadReceiptProps) {
  if (status === "read") {
    return (
      <CheckCheck
        size={14}
        className={cn("text-info flex-shrink-0", className)}
        aria-label="Lu"
      />
    );
  }

  return (
    <Check
      size={14}
      className={cn("text-muted-foreground flex-shrink-0", className)}
      aria-label="Envoyé"
    />
  );
}
