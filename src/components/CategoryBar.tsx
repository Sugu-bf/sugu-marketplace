"use client";

import { useRef } from "react";
import { Container, ScrollArrow, CategoryTile } from "@/components/ui";
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
      <div className="relative">
        <ScrollArrow
          scrollRef={scrollRef}
          direction="left"
          scrollAmount={320}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden sm:flex"
        />

        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-10"
        >
          {categories.map((cat, index) => (
            <CategoryTile
              key={`${cat.slug ?? cat.name}-${index}`}
              subtitle={cat.name}
              image={cat.image}
              bgColor={cat.bgColor}
              href={cat.slug ? `/category/${cat.slug}` : `/search?q=${encodeURIComponent(cat.name)}`}
              footer={cat.productCount != null ? `${cat.productCount} produits` : undefined}
              index={index}
            />
          ))}
        </div>

        <ScrollArrow
          scrollRef={scrollRef}
          direction="right"
          scrollAmount={320}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden sm:flex"
        />
      </div>
    </Container>
  );
}
