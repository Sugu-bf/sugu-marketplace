"use client";

import { ExternalLink } from "lucide-react";
import type { ProductCardMetadata } from "@/lib/messaging/types";
import { formatPrice } from "@/lib/constants";
import { safeSrc } from "../security";

interface ProductCardBubbleProps {
  metadata: ProductCardMetadata;
  isOwn: boolean;
}

/**
 * ProductCardBubble — renders a product card inline within a message bubble.
 * Shows thumbnail, name, price, and link to product page.
 */
export function ProductCardBubble({ metadata, isOwn }: ProductCardBubbleProps) {
  return (
    <div
      className={`
        flex items-center gap-3 p-2.5 rounded-xl
        ${isOwn ? "bg-white/15" : "bg-muted/60"}
      `}
    >
      {/* Product thumbnail */}
      {metadata.thumbnail && (
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white flex-shrink-0">
          <img
            src={safeSrc(metadata.thumbnail)}
            alt={metadata.product_name}
            className="w-full h-full object-contain p-0.5"
            loading="lazy"
          />
        </div>
      )}

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold truncate ${
            isOwn ? "text-white" : "text-foreground"
          }`}
        >
          {metadata.product_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-sm font-bold ${
              isOwn ? "text-white" : "text-primary"
            }`}
          >
            {formatPrice(metadata.price)}
          </span>
          {metadata.compare_price && metadata.compare_price > metadata.price && (
            <span
              className={`text-xs line-through ${
                isOwn ? "text-white/60" : "text-muted-foreground"
              }`}
            >
              {formatPrice(metadata.compare_price)}
            </span>
          )}
        </div>
      </div>

      {/* External link */}
      <a
        href={`/product/${metadata.product_slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`
          flex-shrink-0 p-1.5 rounded-full transition-colors
          ${
            isOwn
              ? "text-white/70 hover:text-white hover:bg-white/10"
              : "text-muted-foreground hover:text-primary hover:bg-primary-50"
          }
        `}
        aria-label={`Voir ${metadata.product_name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={16} />
      </a>
    </div>
  );
}
