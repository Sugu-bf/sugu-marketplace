"use client";

import { useRef } from "react";
import Image from "next/image";
import { Container, ScrollArrow } from "@/components/ui";
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
        {/* Left arrow */}
        <ScrollArrow
          scrollRef={scrollRef}
          direction="left"
          scrollAmount={320}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10"
        />

        {/* Category Cards */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-2"
        >
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="group relative flex-shrink-0 w-[280px] sm:w-[300px] h-[110px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: category.bgColor,
                animation: `fadeSlideUp 0.5s ease-out ${200 + index * 100}ms both`,
              }}
            >
              {/* Background product image */}
              <div className="absolute right-0 top-0 w-[55%] h-full">
                <Image
                  src={category.image}
                  alt={category.subtitle}
                  fill
                  className="object-cover object-center"
                  sizes="200px"
                />
                {/* Gradient blend */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to right, ${category.bgColor} 0%, transparent 40%)`,
                  }}
                />
              </div>

              {/* Text content */}
              <div className="relative z-10 flex flex-col justify-center h-full pl-5 pr-2 max-w-[55%]">
                <h3 className="text-[13px] font-semibold text-foreground leading-tight">
                  {category.title}
                </h3>
                <p className="text-[15px] font-bold text-foreground leading-tight">
                  {category.subtitle}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  À partir de{" "}
                  <span className="font-bold text-info">
                    {category.price}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Right arrow */}
        <ScrollArrow
          scrollRef={scrollRef}
          direction="right"
          scrollAmount={320}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10"
        />
      </div>
    </Container>
  );
}
