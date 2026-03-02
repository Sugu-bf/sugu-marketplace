"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingCart, ArrowRight, Camera, ShoppingBag, Loader2 } from "lucide-react";
import { Container, SectionHeader } from "@/components/ui";
import { formatPrice } from "@/lib/constants";
import { addToCart } from "@/features/home";
import type { DailyBestSaleProduct } from "@/features/home";

interface DailyBestSalesProps {
  products: DailyBestSaleProduct[];
}

function ProductCard({ product, index }: { product: DailyBestSaleProduct; index: number }) {
  const soldPercent = product.totalStock > 0
    ? (product.soldCount / product.totalStock) * 100
    : 0;
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleAdd = useCallback(async () => {
    if (isAdding) return;
    setIsAdding(true);
    setFeedback(null);

    try {
      const result = await addToCart({ product_id: product.id, qty: 1 });
      setFeedback(result.success ? "✓ Ajouté" : (result.message || "Erreur"));
    } catch {
      setFeedback("Erreur");
    } finally {
      setIsAdding(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }, [isAdding, product.id]);

  const href = product.slug ? `/product/${product.slug}` : "#";

  return (
    <Link
      href={href}
      className="group flex items-stretch gap-0 rounded-2xl border border-border-light bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
      style={{
        animation: `fadeSlideUp 0.4s ease-out ${200 + index * 80}ms both`,
      }}
    >
      {/* Product Image */}
      <div className="relative w-[100px] sm:w-[130px] flex-shrink-0 bg-muted flex items-center justify-center">
        {product.promoPercent && (
          <span className="absolute top-2 left-2 z-10 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
            Promo {product.promoPercent}%
          </span>
        )}
        {product.image && !product.image.includes("fallback-product") ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="130px"
          />
        ) : (
          <Camera size={32} className="text-border" />
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        {/* Price */}
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(product.originalPrice)}
          </span>
          <span className="text-sm font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          <span className="text-[10px] text-muted-foreground">/Qty</span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs text-muted-foreground">{product.rating.toFixed(1)}</span>
          <Star size={10} className="text-accent fill-accent" />
          <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
        </div>

        {/* Name */}
        <p className="text-sm font-semibold text-foreground truncate mb-1.5 group-hover:text-primary transition-colors duration-200">
          {product.name}
        </p>

        {/* Store */}
        <div className="flex items-center gap-1 mb-1.5">
          <ShoppingBag size={11} className="text-primary" />
          <span className="text-[11px] text-muted-foreground">Par {product.store}</span>
        </div>

        {/* Sold progress */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-muted-foreground">
              Vendus : {product.soldCount}/{product.totalStock}
            </span>
          </div>
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(soldPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Feedback */}
        {feedback && (
          <p
            className={`text-[10px] font-medium mb-1 ${
              feedback.startsWith("✓") ? "text-green-600" : "text-error"
            }`}
          >
            {feedback}
          </p>
        )}

        {/* Add to cart */}
        <button
          onClick={(e) => { e.preventDefault(); handleAdd(); }}
          disabled={isAdding}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-colors duration-200 disabled:opacity-50"
        >
          {isAdding ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Ajout...
            </>
          ) : (
            <>
              Ajouter au panier
              <ShoppingCart size={12} />
            </>
          )}
        </button>
      </div>
    </Link>
  );
}

export default function DailyBestSales({ products }: DailyBestSalesProps) {
  return (
    <Container
      as="section"
      className="py-8"
      style={{ animation: "fadeSlideUp 0.5s ease-out 200ms both" }}
    >
      {/* Title */}
      <SectionHeader title="Meilleures Ventes du Jour" />

      {/* Grid: product cards + promo card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_280px] gap-4">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}

        {/* Promo card */}
        <div
          className="rounded-2xl overflow-hidden relative flex flex-col md:col-span-2 lg:col-span-1 lg:row-span-2 lg:col-start-4 lg:row-start-1 order-first lg:order-none"
          style={{
            background: "linear-gradient(180deg, #FFF8F0 0%, #FEF3E8 100%)",
            animation: "fadeSlideUp 0.5s ease-out 300ms both",
          }}
        >
          <div className="p-5 flex-1 flex flex-col">
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <ShoppingBag size={20} className="text-primary" />
            </div>

            {/* Text */}
            <p className="text-base font-bold text-foreground leading-snug mb-2">
              {formatPrice(5000)} de réduction sur votre première commande
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Livraison avant 6h15
            </p>

            {/* CTA */}
            <button className="group flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:scale-95 w-fit">
              Acheter maintenant
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Grocery Image */}
          <div className="relative w-full h-[180px] mt-auto">
            <Image
              src="/promos/grocery-bag.png"
              alt="Promotion panier de courses"
              fill
              className="object-cover object-top"
              sizes="280px"
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
