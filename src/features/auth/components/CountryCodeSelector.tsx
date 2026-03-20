"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Search, X } from "lucide-react";
import type { CountryCode } from "../models/auth";

interface CountryCodeSelectorProps {
  countryCodes: CountryCode[];
  value: CountryCode;
  onChange: (code: CountryCode) => void;
  className?: string;
}

function CountryCodeSelector({
  countryCodes,
  value,
  onChange,
  className,
}: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Fermer au clic extérieur ──────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Fermer avec Escape ────────────────────────────────────
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // ── Focus le champ de recherche à l'ouverture ─────────────
  useEffect(() => {
    if (isOpen) {
      // petit délai pour l'animation
      const t = setTimeout(() => searchRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // ── Filtrage par nom ou indicatif ─────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countryCodes;
    return countryCodes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [query, countryCodes]);

  const handleOpen = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setQuery("");
  };

  const handleSelect = (cc: CountryCode) => {
    onChange(cc);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* ── Trigger ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleOpen}
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

      {/* ── Dropdown ────────────────────────────────────── */}
      {isOpen && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-background shadow-xl animate-fade-slide-down"
          role="listbox"
          aria-label="Indicatifs téléphoniques"
        >
          {/* Champ de recherche */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher un pays..."
              className="flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Rechercher un pays"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Effacer la recherche"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Liste des pays */}
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Aucun pays trouvé
              </p>
            ) : (
              filtered.map((cc) => (
                <button
                  key={cc.code}
                  type="button"
                  role="option"
                  aria-selected={cc.code === value.code}
                  onClick={() => handleSelect(cc)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted",
                    cc.code === value.code && "bg-primary/5 text-primary"
                  )}
                >
                  <span className="text-lg leading-none">{cc.flag}</span>
                  <span className="flex-1 text-left">{cc.name}</span>
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    {cc.dialCode}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { CountryCodeSelector };
