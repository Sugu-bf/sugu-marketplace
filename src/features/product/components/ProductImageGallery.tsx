"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/features/product";
import { FavoriteHeart } from "@/features/wishlist/components/FavoriteHeart";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
  /** Product ID, for the favorite heart */
  productId?: string;
}

/**
 * Product image gallery with thumbnail navigation and favorite heart.
 * Client component — handles thumbnail selection. The heart is the shared
 * FavoriteHeart (favorites store, synced with cards, header and /wishlist).
 */
function ProductImageGallery({ images, productName, productId }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentImage = images[selectedIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div className="group relative aspect-square overflow-hidden rounded-2xl bg-white border border-border/80 shadow-sm">
        <Image
          src={currentImage.url}
          alt={currentImage.alt || productName}
          fill
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* Favorite heart */}
        {productId && <FavoriteHeart productId={productId} className="right-3 top-3 h-10 w-10" />}

        {/* Image counter */}
        <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-white transition-all duration-200",
                "hover:border-primary/50",
                idx === selectedIndex
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-border-light"
              )}
              aria-label={`Voir image ${idx + 1}`}
              aria-current={idx === selectedIndex ? "true" : undefined}
            >
              <Image
                src={img.url}
                alt={img.alt || `${productName} - vue ${idx + 1}`}
                fill
                className="object-contain p-1.5"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { ProductImageGallery };
