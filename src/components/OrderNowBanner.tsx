import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Container, ProductCard } from "@/components/ui";
import type { ProductListItem } from "@/features/product";
import type { DailyDealCard } from "@/features/home";

interface OrderNowBannerProps {
  products: ProductListItem[];
  dealCard: DailyDealCard;
}

export default function OrderNowBanner({ products, dealCard }: OrderNowBannerProps) {
  const href = dealCard.href || "/search";
  const ctaLabel = dealCard.ctaLabel || "Explorer la boutique";

  return (
    <Container
      as="section"
      className="py-8"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Left side - Product Cards (horizontal scroll) */}
        <div className="flex gap-3 sm:gap-4 flex-1 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex-shrink-0"
              style={{
                animation: `fadeSlideUp 0.5s ease-out ${300 + index * 100}ms both`,
              }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Right side - Offres du jour */}
        <Link
          href={href}
          className="lg:w-[380px] flex-shrink-0 relative overflow-hidden rounded-3xl bg-primary block group"
          style={{
            minHeight: "340px",
            animation: "fadeSlideUp 0.6s ease-out 500ms both",
          }}
        >
          {/* Content */}
          <div className="relative z-10 p-7">
            {/* Category badge */}
            <span className="inline-block rounded-md bg-accent px-3 py-1.5 text-xs font-bold text-foreground mb-4">
              {dealCard.category}
            </span>

            <h2 className="text-3xl font-extrabold text-white mb-2 leading-tight">
              {dealCard.title}
            </h2>

            <p className="text-sm text-white/90 mb-4">
              {dealCard.subtitle}
            </p>

            <p className="text-sm text-white/70 italic mb-5">
              {dealCard.expiry}
            </p>

            <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-foreground transition-all duration-300 group-hover:shadow-lg group-hover:shadow-black/10 group-hover:scale-105">
              {ctaLabel}
              <ShoppingCart size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>

          {/* Grocery basket image */}
          <div className="absolute bottom-0 right-0 w-[55%] h-[60%]">
            <Image
              src={dealCard.image}
              alt={dealCard.title}
              fill
              className="object-contain object-bottom-right"
              sizes="250px"
            />
          </div>
        </Link>
      </div>

      {/* Bottom divider */}
      <div className="mt-10 border-t border-border" />
    </Container>
  );
}
