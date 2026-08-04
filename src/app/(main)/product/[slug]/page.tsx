import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { stripHtml } from "@/lib/html-utils";
import { buildOgImageUrl } from "@/lib/og-image";
import { SITE_URL } from "@/lib/constants";
import { Container, Breadcrumb } from "@/components/ui";
import { queryProductBySlug, queryRelatedProducts } from "@/features/product";

import { ProductImageGallery } from "@/features/product/components/ProductImageGallery";
import { ProductInfo } from "@/features/product/components/ProductInfo";
import { ProductActions } from "@/features/product/components/ProductActions";
import { ProductDetailTabs } from "@/features/product/components/ProductDetailTabs";
import { RelatedProducts } from "@/features/product/components/RelatedProducts";
import { FacebookPixel } from "@/components/analytics/FacebookPixel";

// ─── Caching ─────────────────────────────────────────────────
//
// Product pages are rendered on demand and cached at the edge, not pre-rendered
// at build time.
//
// A `generateStaticParams` used to sit here, but it never pre-rendered a single
// page: it read `NEXT_PUBLIC_API_URL` (the env var is `NEXT_PUBLIC_API_BASE_URL`)
// and called `/api/v1/products/top-slugs`, which no Laravel route declares. Its
// catch swallowed both failures and returned [].
//
// Bringing it back would not pay for itself either — product data revalidates
// every 120s (RevalidatePresets.frequent), so anything pre-rendered at build is
// stale two minutes later. The speed users experience comes from the edge:
// next.config.ts serves /product/:slug* with `CDN-Cache-Control: max-age=120,
// stale-while-revalidate=600`, so Cloudflare answers every request after the
// first one for a given slug — including while it revalidates in the background.
// Only the very first visitor of a slug ever waits for a render.
//
// Returning [] on purpose. It looks like a no-op but it is not: declaring
// generateStaticParams is what puts the route in Next's Full Route Cache (ISR
// with a blocking fallback), so each slug is rendered once and its HTML reused.
// Drop it and the route becomes `ƒ Dynamic` — re-rendered on every Cloudflare
// miss. Nothing is built ahead of time; slugs are filled in on first request.
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return [];
}

export const dynamicParams = true;

// 120s matches RevalidatePresets.frequent and CACHE_TTL in ProductDetailService.php.
export const revalidate = 120;

// ─── Dynamic SEO Metadata ────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await queryProductBySlug(slug);

  if (!product) {
    return createMetadata({
      title: "Produit introuvable",
      description: "Ce produit n'existe pas ou a été retiré.",
      path: `/product/${slug}`,
      noIndex: true,
    });
  }

  // P4 — strip HTML from any raw description field
  const rawDescription =
    product._api?.seo?.description ??
    product._api?.short_description ??
    product.description ??
    "";
  const plainDescription = stripHtml(rawDescription, 155);

  // P9 — OG image optimised for Facebook (1200×630 via Cloudflare Image Resizing)
  const ogImage = buildOgImageUrl(product.thumbnail);

  // Stock availability for product:* tags
  const inStock = product._api?.stock?.in_stock ?? product.stock > 0;
  const availability = inStock ? "in stock" : "out of stock";

  // Retailer item ID — must match your Facebook Catalogue
  const retailerItemId =
    product._api?.sku || String(product._api?.id ?? product.id);

  return {
    // P1 — standard Next.js metadata (og:type stays "website" here;
    //      actual og:type=product is injected below via `other`)
    ...createMetadata({
      title: product._api?.seo?.title ?? product.name,
      description: plainDescription,
      path: `/product/${slug}`,
      image: ogImage,
    }),

    // P1 + P2 — inject og:type=product and all product:* tags via `other`
    // (Next.js OpenGraph API doesn't support og:type=product natively)
    other: {
      // P1 — correct og:type for Facebook product pages
      "og:type": "product",

      // P2 — Facebook Dynamic Product Ads / Catalogue tags
      "product:price:amount": String(product.price),
      "product:price:currency": "XOF",
      "product:availability": availability,
      "product:condition": "new",
      "product:retailer_item_id": retailerItemId,
      "product:category": product.categoryName,
      "product:brand":
        product._api?.brand?.name ?? product.vendorName,
    },
  };
}

// ─── Page Component (Server) ─────────────────────────────────

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch product + related in parallel (zero waterfall)
  const [product, relatedProducts] = await Promise.all([
    queryProductBySlug(slug),
    queryRelatedProducts(slug, 5),
  ]);

  if (!product) notFound();

  const breadcrumbItems = [
    {
      label: product.categoryName,
      href: product._api?.category?.slug
        ? `/category/${product._api.category.slug}`
        : `/category/${product.categoryName.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`,
    },
    { label: product.name },
  ];

  // P4 — clean text for JSON-LD
  const plainDescription = stripHtml(
    product._api?.seo?.description ?? product.description ?? "",
    500
  );

  // A validity date is meaningful only for a promotion with a real end date.
  const priceValidUntil = product.promoEndsAt?.slice(0, 10);

  const vendorUrl = product.vendorSlug
    ? `${SITE_URL}/store/${product.vendorSlug}`
    : SITE_URL;

  const categorySlug =
    product._api?.category?.slug ??
    product.categoryName.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-");

  return (
    <main className="pb-12">
      {/* P3 — Facebook Pixel: ViewContent event */}
      {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
        <FacebookPixel
          pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
          contentId={
            product._api?.sku || String(product._api?.id ?? product.id)
          }
          contentName={product.name}
          contentCategory={product.categoryName}
          value={product.price}
          currency="XOF"
        />
      )}

      {/* Breadcrumb */}
      <Container className="pt-4 pb-2">
        <Breadcrumb items={breadcrumbItems} />
      </Container>

      {/* Main Product Section */}
      <Container as="article" className="py-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left — Image Gallery */}
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            productId={product._api ? String(product._api.id) : String(product.id)}
          />

          {/* Right — Product Details */}
          <div className="space-y-6">
            <ProductInfo product={product} />
            <ProductActions
              product={product}
              apiData={product._api ?? undefined}
            />
          </div>
        </div>
      </Container>

      {/* Product Tabs */}
      <Container className="py-8 border-t border-border-light">
        <ProductDetailTabs product={product} slug={slug} descriptionHtml={product._api?.description_html} />
      </Container>

      {/* Related Products */}
      <Container className="py-8 border-t border-border-light">
        <RelatedProducts products={relatedProducts} />
      </Container>

      {/* P7 — JSON-LD: Product + BreadcrumbList (corrected) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            // ── Schema 1: Product ─────────────────────────────
            {
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: plainDescription,
              image: product.images.map((img) => img.url),
              sku: product._api?.sku || undefined,
              mpn: product._api?.sku || undefined,
              brand: {
                "@type": "Brand", // ← P7 fix: was "Organization"
                name: product._api?.brand?.name ?? product.vendorName,
              },
              offers: {
                "@type": "Offer",
                url: `${SITE_URL}/product/${product.slug}`,
                priceCurrency: "XOF",
                price: product.price,
                availability:
                  product.stock > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                itemCondition: "https://schema.org/NewCondition",
                priceValidUntil,
                seller: {
                  "@type": "Organization",
                  name: product.vendorName,
                  url: vendorUrl,
                },
              },
              aggregateRating:
                product.reviewCount > 0
                  ? {
                      "@type": "AggregateRating",
                      ratingValue: product.rating,
                      reviewCount: product.reviewCount,
                      bestRating: 5,
                      worstRating: 1,
                    }
                  : undefined,
            },
            // ── Schema 2: BreadcrumbList ──────────────────────
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Accueil",
                  item: SITE_URL,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: product.categoryName,
                  item: `${SITE_URL}/category/${categorySlug}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: product.name,
                  item: `${SITE_URL}/product/${product.slug}`,
                },
              ],
            },
          ]),
        }}
      />
    </main>
  );
}
