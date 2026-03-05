"use client";

import { useRef } from "react";
import Link from "next/link";
import { Container, ScrollArrow } from "@/components/ui";
import type { CategoryPill } from "@/features/home";
import {
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
  Wheat,
  Wine,
  CupSoda,
  Apple,
  Citrus,
  Popcorn,
  CakeSlice,
  Candy,
  Carrot,
  Snowflake,
  Beef,
  Fish,
  Croissant,
  GlassWater,
  type LucideIcon,
} from "lucide-react";

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
  wheat: Wheat,
  wine: Wine,
  "cup-soda": CupSoda,
  apple: Apple,
  citrus: Citrus,
  popcorn: Popcorn,
  "cake-slice": CakeSlice,
  candy: Candy,
  carrot: Carrot,
  snowflake: Snowflake,
  beef: Beef,
  fish: Fish,
  croissant: Croissant,
  "glass-water": GlassWater,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Tag;
}

interface CategoryBarProps {
  categories: CategoryPill[];
}

export default function CategoryBar({ categories }: CategoryBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Container
      as="section"
      className="pt-5"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      <div className="relative flex items-center">
        {/* Left arrow */}
        <ScrollArrow
          scrollRef={scrollRef}
          direction="left"
          scrollAmount={200}
          size="sm"
          className="absolute -left-2 z-10"
        />

        {/* Scrollable Categories */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-10 scrollbar-hide scroll-smooth"
        >
          {categories.map((cat, index) => {
            const IconComponent = getIcon(cat.icon);
            return (
              <Link
                key={`${cat.name}-${index}`}
                href={`/category/${cat.slug}`}
                className="flex flex-shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary-50 hover:text-primary hover:shadow-md hover:scale-105 active:scale-95"
                style={{
                  animation: `fadeSlideUp 0.5s ease-out ${index * 50}ms both`,
                }}
              >
                <IconComponent
                  size={18}
                  strokeWidth={1.5}
                  className="flex-shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="whitespace-nowrap">{cat.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right arrow */}
        <ScrollArrow
          scrollRef={scrollRef}
          direction="right"
          scrollAmount={200}
          size="sm"
          className="absolute -right-2 z-10"
        />
      </div>
    </Container>
  );
}
