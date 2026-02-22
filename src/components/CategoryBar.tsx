"use client";

import { useRef } from "react";
import { Container, ScrollArrow } from "@/components/ui";
import type { CategoryPill } from "@/features/home";

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
          {categories.map((cat, index) => (
            <button
              key={`${cat.name}-${index}`}
              className="flex flex-shrink-0 items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 hover:bg-primary-50 hover:text-primary hover:shadow-md hover:scale-105 active:scale-95"
              style={{
                animation: `fadeSlideUp 0.5s ease-out ${index * 50}ms both`,
              }}
            >
              <span className="text-lg" aria-hidden="true">{cat.emoji}</span>
              <span className="whitespace-nowrap">{cat.name}</span>
            </button>
          ))}
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
