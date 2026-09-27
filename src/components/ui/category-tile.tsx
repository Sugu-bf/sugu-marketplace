"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/constants";

/** Soft pastel backgrounds cycling like home Fresh Categories tiles */
export const CATEGORY_TILE_BG_COLORS = [
  "#E8EDF3",
  "#EAF0E4",
  "#E3EEF0",
  "#F0EDE3",
  "#F0E8E3",
  "#E3F0EA",
] as const;

export function categoryTileBgColor(index: number): string {
  return CATEGORY_TILE_BG_COLORS[index % CATEGORY_TILE_BG_COLORS.length]!;
}

export interface CategoryTileProps {
  /** Eyebrow / small line above the name (e.g. "Frais Tous les Jours") */
  title?: string;
  /** Main category name */
  subtitle: string;
  image?: string | null;
  bgColor?: string;
  href?: string;
  price?: number | null;
  /** Override footer line; defaults to price / "Voir les produits" */
  footer?: string;
  index?: number;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "md" | "sm";
}

const sizeClasses = {
  md: "w-[240px] sm:w-[280px] md:w-[300px] h-[110px]",
  sm: "w-[200px] sm:w-[220px] h-[96px]",
} as const;

/**
 * SWAPP-style category promo tile — colored card, image on the right,
 * gradient blend, text on the left. Used on home, mega menu, category pages.
 */
export function CategoryTile({
  title,
  subtitle,
  image,
  bgColor,
  href,
  price,
  footer,
  index = 0,
  selected = false,
  onClick,
  className,
  size = "md",
}: CategoryTileProps) {
  const resolvedBg = bgColor ?? categoryTileBgColor(index);
  const imgSrc = image && image.trim() ? image : "/categories/placeholder.png";
  const isIconLike = /\.svg($|\?)/i.test(imgSrc) || imgSrc.includes("/icons/");

  const footerContent =
    footer !== undefined ? (
      <span className="font-bold text-info">{footer}</span>
    ) : price != null ? (
      <>
        À partir de{" "}
        <span className="font-bold text-info">{formatPrice(price)}</span>
      </>
    ) : (
      <span className="font-bold text-info">Voir les produits</span>
    );

  const content = (
    <>
      <div className="absolute right-0 top-0 w-[70%] h-full">
        <Image
          src={imgSrc}
          alt={subtitle}
          fill
          className={
            isIconLike
              ? "object-contain object-center p-6 opacity-80"
              : "object-cover object-center"
          }
          sizes={size === "sm" ? "160px" : "200px"}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, ${resolvedBg}ee 0%, ${resolvedBg}cc 25%, transparent 55%)`,
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col justify-center h-full pl-5 pr-2 max-w-[55%]">
        {title ? (
          <h3 className="text-[13px] font-semibold text-foreground leading-tight">
            {title}
          </h3>
        ) : null}
        <p
          className={cn(
            "font-bold text-foreground leading-tight line-clamp-2",
            title ? "text-[15px]" : "text-sm sm:text-[15px]"
          )}
        >
          {subtitle}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">{footerContent}</p>
      </div>
    </>
  );

  const baseClass = cn(
    "group relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-500",
    "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] block text-left",
    sizeClasses[size],
    selected && "ring-2 ring-primary ring-offset-2 shadow-md scale-[1.02]",
    className
  );

  const style = {
    backgroundColor: resolvedBg,
    animation: `fadeSlideUp 0.5s ease-out ${200 + index * 60}ms both`,
  } as const;

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={baseClass} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClass} style={style}>
      {content}
    </button>
  );
}
