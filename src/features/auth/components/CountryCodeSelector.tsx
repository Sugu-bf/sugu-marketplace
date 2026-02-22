"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { CountryCode } from "../models/auth";

interface CountryCodeSelectorProps {
  countryCodes: CountryCode[];
  value: CountryCode;
  onChange: (code: CountryCode) => void;
  className?: string;
}

/**
 * Country code dropdown with flag display.
 * Shows current flag + dial code, dropdown to choose another.
 */
function CountryCodeSelector({
  countryCodes,
  value,
  onChange,
  className,
}: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Sélectionner l'indicatif téléphonique"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-lg leading-none">{value.flag}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 max-h-60 w-56 overflow-y-auto rounded-xl border border-border bg-background py-1 shadow-lg animate-fade-slide-down"
          role="listbox"
          aria-label="Indicatifs téléphoniques"
        >
          {countryCodes.map((cc) => (
            <button
              key={cc.code}
              type="button"
              role="option"
              aria-selected={cc.code === value.code}
              onClick={() => {
                onChange(cc);
                setIsOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted",
                cc.code === value.code && "bg-primary-50 text-primary"
              )}
            >
              <span className="text-lg leading-none">{cc.flag}</span>
              <span className="flex-1 text-left">{cc.name}</span>
              <span className="text-muted-foreground">{cc.dialCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { CountryCodeSelector };
