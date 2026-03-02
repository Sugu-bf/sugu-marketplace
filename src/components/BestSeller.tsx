"use client";

import { useRef } from "react";
import { Container, SectionHeader, ScrollArrows, ViewAllButton, ProductCard } from "@/components/ui";
import type { ProductListItem } from "@/features/product";

interface BestSellerProps {
  products: ProductListItem[];
}

export default function BestSeller({ products }: BestSellerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Container
      as="section"
      className="pt-8"
      style={{ animation: "fadeSlideUp 0.5s ease-out 400ms both" }}
    >
      {/* Section Header */}
      <SectionHeader
        title="Best Seller"
        action={
          <div className="flex items-center gap-3">
            <ViewAllButton label="View All" count={40} />
            <div className="hidden sm:block">
              <ScrollArrows scrollRef={scrollRef} />
            </div>
          </div>
        }
      />

      {/* Products Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-4 px-4 lg:mx-0 lg:px-0"
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            style={{
              animation: `fadeSlideUp 0.5s ease-out ${500 + index * 100}ms both`,
            }}
          >
            <ProductCard product={product} showSaleBadge />
          </div>
        ))}
      </div>
    </Container>
  );
}
