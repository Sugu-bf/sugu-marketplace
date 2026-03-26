"use client";

import { useRef } from "react";
import Link from "next/link";
import { Container, SectionHeader, ScrollArrows, ViewAllButton, ProductCard } from "@/components/ui";
import type { ProductListItem } from "@/features/product";
import type { Tag } from "@/features/home";

interface TrendingStoresProps {
  tags: Tag[];
  products: ProductListItem[];
}

export default function TrendingStores({ tags, products }: TrendingStoresProps) {
  const productScrollRef = useRef<HTMLDivElement>(null);

  return (
    <Container
      as="section"
      className="pt-10 pb-8"
      style={{ animation: "fadeSlideUp 0.5s ease-out 500ms both" }}
    >
      {/* Section Header */}
      <SectionHeader
        title="Favoris des Boutiques"
        action={
          <div className="flex items-center gap-3">
            <ViewAllButton label="Voir tout" />
            <div className="hidden sm:block">
              <ScrollArrows scrollRef={productScrollRef} />
            </div>
          </div>
        }
      />

      {/* Tags — each links to its category page */}
      <div className="relative mb-6">
        <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-hide scroll-smooth">
          {tags.map((tag, index) => {
            const href = tag.slug ? `/category/${tag.slug}` : "/search";
            const isFirst = index === 0;
            return (
              <Link
                key={index}
                href={href}
                className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isFirst
                    ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                    : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:bg-primary-50 hover:text-primary"
                }`}
                style={{
                  animation: `fadeSlideUp 0.4s ease-out ${700 + index * 40}ms both`,
                }}
              >
                {tag.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Product Cards */}
      <div
        ref={productScrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-4 px-4 lg:mx-0 lg:px-0"
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            style={{
              animation: `fadeSlideUp 0.5s ease-out ${800 + index * 100}ms both`,
            }}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </Container>
  );
}
