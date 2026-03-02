/**
 * JSON-LD Structured Data helpers — SEO module.
 *
 * Generates JSON-LD structured data for Google rich results.
 * Used via <script type="application/ld+json"> in pages.
 */

import { SITE_NAME, SITE_URL, CONTACT } from "@/lib/constants";

// ─── Organization (site-wide) ────────────────────────────────

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: CONTACT.phone,
      email: CONTACT.email,
      contactType: "customer service",
      areaServed: "BF",
      availableLanguage: "French",
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: CONTACT.address,
      addressCountry: "BF",
    },
  };
}

// ─── WebSite (for sitelinks search box) ──────────────────────

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── Product ─────────────────────────────────────────────────

export interface ProductJsonLdInput {
  name: string;
  description: string;
  slug: string;
  image: string;
  price: number;
  currency?: string;
  availability?: "InStock" | "OutOfStock" | "PreOrder";
  brand?: string;
  sku?: string;
  rating?: { average: number; count: number };
}

export function productJsonLd(product: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    url: `${SITE_URL}/product/${product.slug}`,
    sku: product.sku,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency ?? "XOF",
      availability: `https://schema.org/${product.availability ?? "InStock"}`,
      seller: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    },
    ...(product.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.average,
            reviewCount: product.rating.count,
          },
        }
      : {}),
  };
}

// ─── BreadcrumbList ──────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  };
}

// ─── Blog Article ────────────────────────────────────────────

export interface ArticleJsonLdInput {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
  author?: string;
  image?: string;
}

export function articleJsonLd(article: ArticleJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt ?? article.publishedAt,
    url: `${SITE_URL}/blog/${article.slug}`,
    author: article.author
      ? { "@type": "Person", name: article.author }
      : undefined,
    image: article.image,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// ─── FAQ Page ────────────────────────────────────────────────

export interface FaqJsonLdItem {
  question: string;
  answer: string;
}

export function faqPageJsonLd(items: FaqJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

// ─── Helper Component ────────────────────────────────────────

/**
 * Render JSON-LD as a script tag (safe for RSC).
 *
 * @example
 * <JsonLd data={productJsonLd({ ... })} />
 */
export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data);
}
