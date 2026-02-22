"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/features/product";
import { Heart } from "lucide-react";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

/**
 * Product image gallery with thumbnail navigation and wishlist button.
 * Client component — handles thumbnail selection interaction.
 */
function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const currentImage = images[selectedIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image */}
      <div className="group relative aspect-square overflow-hidden rounded-2xl bg-muted">
        <Image
          src={currentImage.url}
          alt={currentImage.alt || productName}
          fill
          className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />

        {/* Wishlist button */}
        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          className={cn(
            "absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all duration-300",
            "hover:scale-110 active:scale-90",
            isWishlisted
              ? "bg-primary text-white"
              : "bg-white/90 text-muted-foreground hover:bg-white hover:text-primary"
          )}
          aria-label={isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart size={18} className={cn(isWishlisted && "fill-current")} />
        </button>

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
                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-all duration-200",
                "hover:border-primary/50",
                idx === selectedIndex
                  ? "border-primary ring-1 ring-primary/20"
                  : "border-transparent"
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
