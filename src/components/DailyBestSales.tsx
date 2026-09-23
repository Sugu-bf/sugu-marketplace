"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowRight, Camera, ShoppingBag, Loader2 } from "lucide-react";
import { Container, SectionHeader } from "@/components/ui";
import { formatPrice } from "@/lib/constants";
import { addToCart } from "@/features/home";
import type { DailyBestSaleProduct, DailyBestSalesPromo } from "@/features/home";
import { emitCartChanged } from "@/features/cart/events/cart-events";

interface DailyBestSalesProps {
  products: DailyBestSaleProduct[];
  promo?: DailyBestSalesPromo | null;
}

function ProductCard({ product, index }: { product: DailyBestSaleProduct; index: number }) {
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const router = useRouter();
  const href = product.slug ? `/product/${product.slug}` : "#";

  const handleAdd = useCallback(async () => {
    if (isAdding) return;
    if (product.hasVariants) {
      router.push(href);
      return;
    }
    if (product.isInStock === false) {
      setFeedback("Rupture de stock");
      return;
    }
    setIsAdding(true);
    setFeedback(null);
    const qty = Math.max(1, product.minOrderQuantity ?? 1);

    try {
      const result = await addToCart({
        product_id: product.id,
        qty,
      });
      setFeedback(result.success ? "✓ Ajouté" : (result.message || "Erreur"));
      if (result.success) emitCartChanged({ action: "add" });
    } catch {
      setFeedback("Erreur");
    } finally {
      setIsAdding(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }, [href, isAdding, product, router]);

  return (
    <Link
      href={href}
      className="group flex items-stretch gap-0 rounded-2xl border border-border-light bg-white overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer"
      style={{
        animation: `fadeSlideUp 0.4s ease-out ${200 + index * 80}ms both`,
      }}
    >
      {/* Product Image */}
      <div className="relative w-[100px] sm:w-[130px] flex-shrink-0 bg-white border-r border-border-light/60 flex items-center justify-center">
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
            className="object-contain p-1.5 mix-blend-multiply"
            sizes="130px"
          />
        ) : (
          <Camera size={32} className="text-border" />
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        {/* Name */}
        <p className="text-sm font-bold text-foreground truncate mb-1 group-hover:text-primary transition-colors duration-200">
          {product.name}
        </p>

        {/* Price */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1.5">
          <span className="text-sm font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Store */}
        <div className="flex items-center gap-1 mb-2 min-w-0">
          <ShoppingBag size={11} className="text-primary flex-shrink-0" />
          <span className="text-[11px] text-muted-foreground truncate">Par {product.store}</span>
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
          type="button"
          onClick={(e) => { e.preventDefault(); handleAdd(); }}
          disabled={isAdding || product.isInStock === false}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-colors duration-200 disabled:opacity-50 mt-auto"
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

const DEFAULT_PROMO: DailyBestSalesPromo = {
  title: "5 000 F de réduction sur votre première commande",
  subtitle: "Livraison avant 6h15",
  ctaLabel: "Acheter maintenant",
  href: "/search",
  image: "/promos/grocery-bag.png",
};

export default function DailyBestSales({ products, promo }: DailyBestSalesProps) {
  const card = promo ?? DEFAULT_PROMO;

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
        <Link
          href={card.href}
          className="rounded-2xl overflow-hidden relative flex flex-col md:col-span-2 lg:col-span-1 lg:row-span-2 lg:col-start-4 lg:row-start-1 order-first lg:order-none group"
          style={{
            background: "linear-gradient(180deg, #FFF8F0 0%, #FEF3E8 100%)",
            animation: "fadeSlideUp 0.5s ease-out 300ms both",
          }}
        >
          <div className="p-5 flex-1 flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <ShoppingBag size={20} className="text-primary" />
            </div>

            <p className="text-base font-bold text-foreground leading-snug mb-2">
              {card.title}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {card.subtitle}
            </p>

            <span className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-primary-dark group-hover:shadow-lg group-hover:shadow-primary/25 w-fit">
              {card.ctaLabel}
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>

          <div className="relative w-full h-[180px] mt-auto">
            <Image
              src={card.image || "/promos/grocery-bag.png"}
              alt={card.title}
              fill
              className="object-cover object-top"
              sizes="280px"
            />
          </div>
        </Link>
      </div>
    </Container>
  );
}
