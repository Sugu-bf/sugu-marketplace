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
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    // Same asset the other Sugu properties declare for this @id. public/logo.png
    // is a JPEG with a checkerboard baked in — it must not be the brand logo
    // Google shows in a knowledge panel.
    logo: {
      "@type": "ImageObject",
      url: "https://cdn.sugu.pro/p/sugu_logo.png",
    },
    contactPoint: {
      "@type": "ContactPoint",
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

// ─── WebSite (site name and publisher identity) ──────────────

export function webSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: ["SUGU", "sugu.pro"],
    url: SITE_URL,
    inLanguage: "fr-BF",
    publisher: { "@id": `${SITE_URL}/#organization` },
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

// ─── Serialization ───────────────────────────────────────────

const JSON_LD_UNSAFE_CHARS: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

/**
 * Serialize JSON-LD for the body of a `<script type="application/ld+json">`.
 *
 * The only way to serialize structured data into a page: product, store and
 * blog fields come from sellers and admins, and a `</script>` in them would
 * close the tag and run what follows. `<`, `>` and `&` are written as JSON
 * escapes (same value once parsed), and so are U+2028/U+2029.
 *
 * @example
 * <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />
 */
export function safeJsonLd(data: unknown): string {
  return (JSON.stringify(data) ?? "null").replace(/[<>&\u2028\u2029]/g, (char) => JSON_LD_UNSAFE_CHARS[char]);
}
