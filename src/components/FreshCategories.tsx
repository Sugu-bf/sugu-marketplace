"use client";

import { useRef } from "react";
import { Container, ScrollArrow, CategoryTile } from "@/components/ui";
import type { FreshCategory } from "@/features/home";

interface FreshCategoriesProps {
  categories: FreshCategory[];
}

export default function FreshCategories({ categories }: FreshCategoriesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Container
      as="section"
      className="py-6"
      style={{ animation: "fadeSlideUp 0.5s ease-out 300ms both" }}
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
          {categories.map((category, index) => (
            <CategoryTile
              key={category.id}
              title={category.title}
              subtitle={category.subtitle}
              image={category.image}
              bgColor={category.bgColor}
              href={category.href || `/search?q=${encodeURIComponent(category.subtitle)}`}
              price={category.price}
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
