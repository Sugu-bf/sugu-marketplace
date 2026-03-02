"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  ChevronRight,
  Tag,
  ShoppingBag,
  Shirt,
  Laptop,
  Home,
  Dumbbell,
  Heart,
  Utensils,
  Baby,
  Car,
  Sparkles,
  BookOpen,
  Music,
  Gamepad2,
  PawPrint,
  Wrench,
  Package,
  Smartphone,
  Tv,
  Headphones,
  Watch,
  Camera,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeaderCategory } from "../api/header.schemas";

/**
 * Map of Lucide icon names (kebab-case, as stored in the DB) to components.
 * Fallback: Tag icon.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  tag: Tag,
  "shopping-bag": ShoppingBag,
  shirt: Shirt,
  laptop: Laptop,
  home: Home,
  dumbbell: Dumbbell,
  heart: Heart,
  utensils: Utensils,
  baby: Baby,
  car: Car,
  sparkles: Sparkles,
  "book-open": BookOpen,
  music: Music,
  gamepad: Gamepad2,
  "paw-print": PawPrint,
  wrench: Wrench,
  package: Package,
  smartphone: Smartphone,
  tv: Tv,
  headphones: Headphones,
  watch: Watch,
  camera: Camera,
};

function getCategoryIcon(cat: HeaderCategory): LucideIcon {
  const name = cat.icon?.name;
  if (name && ICON_MAP[name]) return ICON_MAP[name];
  return Tag;
}

interface CategoriesMegaMenuProps {
  categories: HeaderCategory[];
}

/**
 * CategoriesMegaMenu — full-width mega menu under the header.
 *
 * Left sidebar: scrollable list of parent categories with icons.
 * Right content: subcategories grid for the active category.
 *
 * Hover-delay managed to avoid accidental close.
 */
export default function CategoriesMegaMenu({ categories }: CategoriesMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeCatId, setActiveCatId] = useState<string | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeCategory = categories.find((c) => c.id === activeCatId) ?? categories[0];

  const handleEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }, []);

  const handleLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 200);
  }, []);

  // Toggle on click for keyboard/touch
  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (categories.length === 0) return null;

  return (
    <div
      className="flex-shrink-0"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      ref={menuRef}
    >
      {/* Trigger button */}
      <button
        className="hidden lg:flex items-center gap-2 text-white/90 hover:text-white transition-colors duration-200"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Ouvrir le menu des catégories"
        id="categories-mega-menu-trigger"
      >
        <Menu size={20} />
        <span className="text-sm font-semibold whitespace-nowrap">
          Toutes les catégories
        </span>
      </button>

      {/* Mega Menu Panel — drops directly below the orange header bar */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 hidden lg:block"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel: positions below the sticky header (nearest positioned ancestor) */}
          <div
            className="absolute left-0 right-0 top-full z-50 hidden lg:block"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
          >
            <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
              <div className="flex bg-white rounded-b-2xl shadow-2xl border border-t-0 border-gray-100 overflow-hidden animate-fade-slide-down">
                {/* ── Left Sidebar — Category List ── */}
                <nav
                  className="w-[260px] flex-shrink-0 border-r border-border bg-muted/50 py-2 max-h-[480px] overflow-y-auto scrollbar-hide"
                  aria-label="Liste des catégories"
                >
                  {categories.map((cat) => {
                    const isActive = cat.id === activeCatId;
                    const iconUrl = cat.icon?.url;
                    const IconComponent = getCategoryIcon(cat);

                    return (
                      <button
                        key={cat.id}
                        onMouseEnter={() => setActiveCatId(cat.id)}
                        onClick={() => setActiveCatId(cat.id)}
                        className={cn(
                          "flex items-center gap-3 w-full px-4 py-2.5 text-left transition-all duration-150",
                          isActive
                            ? "bg-white text-primary border-l-[3px] border-primary font-semibold"
                            : "text-foreground/70 border-l-[3px] border-transparent hover:bg-white/70 hover:text-primary"
                        )}
                        aria-selected={isActive}
                        role="tab"
                      >
                        {iconUrl ? (
                          <Image
                            src={iconUrl}
                            alt=""
                            width={16}
                            height={16}
                            className="flex-shrink-0"
                            unoptimized
                          />
                        ) : (
                          <IconComponent
                            size={16}
                            strokeWidth={1.5}
                            className={cn(
                              "flex-shrink-0 transition-colors duration-150",
                              isActive ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                        )}
                        <span className="text-sm leading-snug truncate">{cat.name}</span>
                        <ChevronRight
                          size={14}
                          className="ml-auto text-border flex-shrink-0"
                        />
                      </button>
                    );
                  })}
                </nav>

                {/* ── Right Content — Subcategories ── */}
                <div
                  className="flex-1 p-6 max-h-[480px] overflow-y-auto scrollbar-hide"
                  role="tabpanel"
                  aria-label={`Sous-catégories de ${activeCategory?.name}`}
                >
                  {activeCategory && (
                    <div>
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-base font-bold text-foreground">
                          {activeCategory.name}
                        </h3>
                        <Link
                          href={`/category/${activeCategory.slug}`}
                          className="text-xs font-medium text-primary hover:underline whitespace-nowrap italic"
                          onClick={() => setOpen(false)}
                        >
                          Parcourir les sélections en vedette
                        </Link>
                      </div>

                      {/* Children Grid */}
                      <div className="grid grid-cols-5 xl:grid-cols-7 gap-4">
                        {(activeCategory.children ?? []).map((child) => (
                          <Link
                            key={child.id}
                            href={`/category/${child.slug}`}
                            className="group flex flex-col items-center gap-2 text-center"
                            onClick={() => setOpen(false)}
                          >
                            <div className="w-[72px] h-[72px] rounded-full bg-muted flex items-center justify-center transition-all duration-200 group-hover:bg-primary-50 group-hover:shadow-md overflow-hidden">
                              {child.image ? (
                                <Image
                                  src={child.image}
                                  alt={child.name}
                                  width={48}
                                  height={48}
                                  className="object-contain"
                                  sizes="48px"
                                />
                              ) : (
                                <Camera
                                  size={22}
                                  className="text-border group-hover:text-primary transition-colors duration-200"
                                />
                              )}
                            </div>
                            <span className="text-[11px] leading-tight text-muted-foreground group-hover:text-primary transition-colors duration-200 max-w-[90px]">
                              {child.name}
                            </span>
                          </Link>
                        ))}

                        {/* "Voir plus" Link */}
                        <Link
                          href={`/category/${activeCategory.slug}`}
                          className="group flex flex-col items-center gap-2 text-center"
                          onClick={() => setOpen(false)}
                        >
                          <div className="w-[72px] h-[72px] rounded-full bg-muted/50 border-2 border-dashed border-border flex items-center justify-center transition-all duration-200 group-hover:border-primary/40 group-hover:bg-primary-50">
                            <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors duration-200">
                              Voir plus
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

