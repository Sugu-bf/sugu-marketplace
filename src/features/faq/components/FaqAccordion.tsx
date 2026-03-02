"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";
import type { FaqItem } from "@/features/faq";

// ─── FaqAccordion ────────────────────────────────────────────

interface FaqAccordionProps {
  items: FaqItem[];
}

function FaqAccordion({ items }: FaqAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!items.length) return null;

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
                isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {/* Answer is pre-sanitized HTML from the backend — safe to render */}
              <div
                className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── FaqSearch ───────────────────────────────────────────────

interface FaqSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function FaqSearch({ value, onChange, placeholder = "Rechercher dans la FAQ..." }: FaqSearchProps) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-light bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
      />
    </div>
  );
}

export { FaqAccordion, FaqSearch };
