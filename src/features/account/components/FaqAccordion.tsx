"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/features/account";

interface FaqAccordionProps {
  items: FaqItem[];
}

function FaqAccordion({ items }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {items.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <div
            key={faq.id}
            className={cn(
              "rounded-xl border transition-all duration-200",
              isOpen ? "border-primary/30 bg-primary-50/20 shadow-sm" : "border-border-light bg-background"
            )}
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : faq.id)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
              aria-expanded={isOpen}
            >
              <span className={cn("text-sm font-medium", isOpen ? "text-primary font-semibold" : "text-foreground")}>
                {faq.question}
              </span>
              <ChevronDown
                size={16}
                className={cn(
                  "flex-shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180 text-primary"
                )}
              />
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { FaqAccordion };
