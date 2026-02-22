import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { Container, Breadcrumb } from "@/components/ui";
import { queryProductBySlug, queryRelatedProducts } from "@/features/product";

import { ProductImageGallery } from "@/features/product/components/ProductImageGallery";
import { ProductInfo } from "@/features/product/components/ProductInfo";
import { ProductPricing } from "@/features/product/components/ProductPricing";
import { BulkPriceTable } from "@/features/product/components/BulkPriceTable";
import { ProductActions } from "@/features/product/components/ProductActions";
import { ProductDetailTabs } from "@/features/product/components/ProductDetailTabs";
import { RelatedProducts } from "@/features/product/components/RelatedProducts";

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

  return createMetadata({
    title: product.name,
    description: product.description.slice(0, 155),
    path: `/product/${slug}`,
    image: product.thumbnail,
  });
}

// ─── Page Component (Server) ─────────────────────────────────

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await queryProductBySlug(slug);

  if (!product) notFound();

  const relatedProducts = await queryRelatedProducts(product.id, 5);

  const breadcrumbItems = [
    { label: product.categoryName, href: `/category/${product.categoryName.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}` },
    { label: product.name },
  ];

  return (
    <main className="pb-12">
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
          />

          {/* Right — Product Details */}
          <div className="space-y-6">
            <ProductInfo product={product} />
            <ProductPricing product={product} />

            {product.bulkPrices && product.bulkPrices.length > 0 && (
              <BulkPriceTable
                tiers={product.bulkPrices}
                basePrice={product.originalPrice ?? product.price}
              />
            )}

            <ProductActions product={product} />
          </div>
        </div>
      </Container>

      {/* Product Tabs */}
      <Container className="py-8 border-t border-border-light">
        <ProductDetailTabs product={product} />
      </Container>

      {/* Related Products */}
      <Container className="py-8 border-t border-border-light">
        <RelatedProducts products={relatedProducts} />
      </Container>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: product.images.map((img) => img.url),
            sku: product.slug,
            brand: {
              "@type": "Organization",
              name: product.vendorName,
            },
            offers: {
              "@type": "Offer",
              url: `https://sugu.pro/product/${product.slug}`,
              priceCurrency: product.currency,
              price: product.price,
              availability: product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Organization",
                name: product.vendorName,
              },
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.reviewCount,
            },
          }),
        }}
      />
    </main>
  );
}
