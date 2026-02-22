"use client";

import { useRef } from "react";
import Image from "next/image";
import { Container, SectionHeader, ScrollArrows, ViewAllButton } from "@/components/ui";
import type { Brand } from "@/features/home";

interface ShopByBrandsProps {
  brands: Brand[];
}

export default function ShopByBrands({ brands }: ShopByBrandsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Container
      as="section"
      className="py-8"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      {/* Header */}
      <SectionHeader
        title="Shop by Brands"
        action={
          <div className="flex items-center gap-3">
            <ViewAllButton label="View All Deals" />
            <ScrollArrows scrollRef={scrollRef} size="sm" />
          </div>
        }
      />

      {/* Brand logos */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
      >
        {brands.map((brand, index) => (
          <div
            key={brand.id}
            className="flex-shrink-0 cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
              animation: `fadeSlideUp 0.5s ease-out ${300 + index * 70}ms both`,
            }}
          >
            <div className="relative w-[110px] h-[110px] sm:w-[120px] sm:h-[120px]">
              <Image
                src={brand.image}
                alt={brand.name}
                fill
                className="object-contain"
                sizes="120px"
              />
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
