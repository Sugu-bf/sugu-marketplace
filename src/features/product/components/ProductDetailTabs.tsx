"use client";

import { useState, useEffect } from "react";
import { Tabs } from "@/components/ui";
import { CheckCircle, Star } from "lucide-react";
import type { Product } from "@/features/product";
import { fetchProductReviews, type ApiReview } from "@/features/product";

interface ProductTabsProps {
  product: Product;
  /** Product slug for fetching reviews */
  slug?: string;
  /** Pre-rendered HTML description from backend */
  descriptionHtml?: string;
}

/**
 * Converts raw description text/HTML to formatted HTML:
 * 1. Replaces standalone image URLs with <img> tags
 * 2. Replaces markdown images ![alt](url) with <img> tags
 * 3. Wraps plain text paragraphs with <p> tags if no HTML structure is present
 */
function formatDescriptionHtml(rawContent: string): string {
  if (!rawContent) return "";

  let html = rawContent;

  // 1. Replace standalone image URLs (not inside src="..." or href="...") with <img> tags
  const standaloneImageUrlRegex = /(?<!src=["']|href=["'])(https?:\/\/[^\s<"']+\.(?:png|jpe?g|webp|gif|svg)(\?[^\s<"']*)?)/gi;
  html = html.replace(standaloneImageUrlRegex, (url) => {
    return `<img src="${url}" alt="Illustration produit" class="max-w-full h-auto rounded-2xl my-4 border border-border/80 shadow-sm bg-white p-2" />`;
  });

  // 2. Replace markdown images ![alt](url)
  const markdownImageRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s\)]+)\)/gi;
  html = html.replace(markdownImageRegex, (_, alt, url) => {
    return `<img src="${url}" alt="${alt || "Illustration"}" class="max-w-full h-auto rounded-2xl my-4 border border-border/80 shadow-sm bg-white p-2" />`;
  });

  // 3. If plain text without HTML tags, wrap paragraphs for spacing
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    html = html
      .split(/\n\s*\n/)
      .map((para) => `<p>${para.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }

  return html;
}

/**
 * Product detail tabs — Description, Specifications, Reviews.
 *
 * Reviews are loaded from the real API when the Reviews tab is first opened.
 * Description and Specifications are rendered from product data.
 */
function ProductDetailTabs({ product, slug, descriptionHtml }: ProductTabsProps) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewMeta, setReviewMeta] = useState<{ total: number; has_more: boolean; next_cursor: string | number | null }>({
    total: 0, has_more: false, next_cursor: null,
  });
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  // Fetch reviews when tab is opened
  useEffect(() => {
    if (activeTab === "reviews" && !reviewsLoaded && slug) {
      setIsLoadingReviews(true);
      fetchProductReviews(slug, 10)
        .then(({ reviews: r, meta }) => {
          setReviews(r);
          setReviewMeta(meta);
          setReviewsLoaded(true);
        })
        .finally(() => setIsLoadingReviews(false));
    }
  }, [activeTab, reviewsLoaded, slug]);

  // Load more reviews
  const handleLoadMore = async () => {
    if (!slug || !reviewMeta.has_more || isLoadingReviews) return;
    setIsLoadingReviews(true);
    try {
      const { reviews: more, meta } = await fetchProductReviews(slug, 10, reviewMeta.next_cursor);
      setReviews((prev) => [...prev, ...more]);
      setReviewMeta(meta);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const formatReviewDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const reviewCountLabel = reviewsLoaded ? reviewMeta.total : product.reviewCount;

  // Format description content: parse standalone image URLs, markdown images, and line breaks into proper HTML
  const rawDescription = descriptionHtml || product.description || "";
  const formattedDescriptionHtml = formatDescriptionHtml(rawDescription);

  const tabs = [
    {
      id: "description",
      label: "Description",
      content: (
        <div
          className="prose prose-sm max-w-none text-muted-foreground leading-relaxed [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-2xl [&_img]:my-4 [&_img]:shadow-sm [&_img]:border [&_img]:border-border/80 [&_img]:bg-white [&_img]:p-2 [&_img]:object-contain [&_a]:text-primary [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: formattedDescriptionHtml }}
        />
      ),
    },
    {
      id: "specifications",
      label: "Caractéristiques",
      content: product.specifications ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {Object.entries(product.specifications).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between border-b border-border-light pb-2 text-sm"
            >
              <span className="font-medium text-muted-foreground">{key}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucune caractéristique disponible.</p>
      ),
    },
    {
      id: "reviews",
      label: `Avis (${reviewCountLabel})`,
      content: (
        <div className="space-y-4">
          {isLoadingReviews && reviews.length === 0 && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border-light p-4 space-y-2 animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-3 w-24 bg-muted rounded" />
                      <div className="h-2 w-16 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-3/4 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}

          {!isLoadingReviews && reviews.length === 0 && reviewsLoaded && (
            <p className="text-sm text-muted-foreground py-4">
              Aucun avis pour ce produit. Soyez le premier à donner votre avis !
            </p>
          )}

          {reviews.map((review) => (
            <article
              key={String(review.id)}
              className="rounded-xl border border-border/80 bg-white shadow-sm p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {review.author}
                      {review.is_verified_purchase && (
                        <span className="ml-1.5 text-[10px] font-medium text-green-600 inline-flex items-center gap-0.5">
                          <CheckCircle size={10} /> Achat vérifié
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatReviewDate(review.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}
                    />
                  ))}
                </div>
              </div>
              {review.title && (
                <p className="text-sm font-semibold text-foreground">{review.title}</p>
              )}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.body}
              </p>
            </article>
          ))}

          {reviewMeta.has_more && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingReviews}
              className="w-full py-2 text-sm font-medium text-primary hover:text-primary-dark disabled:opacity-50"
            >
              {isLoadingReviews ? "Chargement…" : "Voir plus d'avis"}
            </button>
          )}
        </div>
      ),
    },
  ];

  return <Tabs tabs={tabs} defaultTab="description" onChange={setActiveTab} />;
}

export { ProductDetailTabs };
