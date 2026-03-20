---
description: Optimisation SEO & Facebook Ads — Page Détail Produit (/product/[slug])
---

# Chantier : SEO & Facebook Ads — Product Detail Page

> **Périmètre** : Next.js frontend (`sugu-marketplace`) + Laravel backend (`sugu`)
> **Objectif** : Page produit indexable par Google, avec Rich Results, prête pour les Dynamic Product Ads et les campagnes Facebook.
> **Priorité** : Les tickets P1–P4 sont bloquants avant toute pub. P5–P8 sont impératifs avant le lancement. P9–P12 sont des améliorations continues.

---

## Contexte technique

- **Frontend** : Next.js App Router (SSR + ISR), TypeScript strict, Zod
- **Backend** : Laravel + Spatie MediaLibrary, modèle `SeoMeta` (champs: `meta_title`, `meta_description`, `open_graph: JSON`, `twitter_cards: JSON`)
- **CDN** : Cloudflare R2 via `cdn.sugu.pro`
- **Clés fichiers frontend** :
  - Page : `src/app/(main)/product/[slug]/page.tsx`
  - Metadata helper : `src/lib/metadata.ts`
  - Schemas Zod : `src/features/product/api/product-detail.schemas.ts`
  - Mappers : `src/features/product/api/product-detail.mappers.ts`
  - Queries : `src/features/product/queries/product-queries.ts`
  - Config Next : `next.config.ts`
- **Clés fichiers backend** :
  - Service PDP : `app/Services/Products/ProductDetailService.php`
  - Modèle SEO : `app/Models/SeoMeta.php`
  - Routes API: `routes/api.php` (or `routes/api/`)

---

## TICKET P1 — Corriger `og:type` → `"product"` pour les pages produit

### Contexte
`createMetadata()` dans `src/lib/metadata.ts` hardcode `type: "website"` pour toutes les pages. Les pages produit doivent retourner `og:type = product`.

### Backend (../sugu) — Aucun changement requis

### Frontend (sugu-marketplace)

**Fichier : `src/lib/metadata.ts`**

Ajouter un paramètre `type` optionnel à l'interface `PageMetadataOptions` :

```typescript
interface PageMetadataOptions {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "product" | "article"; // ← AJOUTER
}
```

Dans `createMetadata`, utiliser ce paramètre dans le bloc `openGraph` :

```typescript
openGraph: {
  title: fullTitle,
  description,
  url,
  siteName: SITE_NAME,
  locale: SEO.locale,
  type: (type ?? SEO.type) as "website" | "product",  // ← MODIFIER
  images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
},
```

**Fichier : `src/app/(main)/product/[slug]/page.tsx`**

Dans `generateMetadata`, passer `type: "product"` :

```typescript
return createMetadata({
  title: product._api?.seo?.title ?? product.name,
  description: plainDescription,  // voir ticket P4
  path: `/product/${slug}`,
  image: product.thumbnail,
  type: "product",  // ← AJOUTER
});
```

### Tests
- Inspecter le `<head>` en prod → `<meta property="og:type" content="product" />`
- Facebook Sharing Debugger : https://developers.facebook.com/tools/debug/ → vérifier le champ "Object Type"

---

## TICKET P2 — Injecter les Open Graph Product tags (Facebook Catalogue)

### Contexte
Next.js supporte les `other` metadata pour les balises non-standard. Les `product:*` tags sont requis par [Facebook pour les Dynamic Product Ads](https://developers.facebook.com/docs/marketing-api/catalog/reference).

### Backend (../sugu) — Enrichir `buildSeo()` dans `ProductDetailService.php`

Le modèle `SeoMeta` a déjà un champ `open_graph: JSON`. L'utiliser pour stocker des surcharges admin (optionnel). Pour l'instant, le backend peut retourner les données brutes produit — les `product:*` tags sont construits côté frontend.

**Optionnel mais recommandé** : Ajouter `facebook_item_id` dans la réponse SEO pour le catalogue Facebook :

Dans `buildSeo(Product $product): array`, ajouter :

```php
'facebook' => [
    'item_id'      => (string) $product->id,
    'condition'    => 'new',  // ou un champ product->condition si disponible
    'availability' => $product->variants->sum('stock') > 0 ? 'in stock' : 'out of stock',
],
```

Mettre à jour le schema Zod frontend (`ApiSeoSchema`) pour accepter ce champ optionnel :

```typescript
export const ApiSeoSchema = z.object({
  title: z.string(),
  description: z.string(),
  canonical: z.string(),
  facebook: z.object({           // ← AJOUTER (optionnel)
    item_id: z.string(),
    condition: z.string().default("new"),
    availability: z.string(),
  }).optional(),
});
```

### Frontend — Injecter les balises dans `page.tsx`

Next.js ne supporte pas nativement les `product:*` tags via l'API `metadata`. Il faut les injecter manuellement via `<meta>` dans le JSX (dans le `<head>` via le layout parent ou directement dans `page.tsx` via un composant `<head>`).

**La bonne approche avec Next.js App Router** : utiliser `metadata.other` pour les balises non-standard.

Dans `generateMetadata` de `page.tsx` :

```typescript
const inStock = (product._api?.stock?.in_stock ?? product.stock > 0);
const availability = inStock ? "in stock" : "out of stock";

return {
  ...createMetadata({ ... }),
  other: {
    // Open Graph Product tags (Facebook Catalogue / Dynamic Ads)
    "product:price:amount":    String(product.price),
    "product:price:currency":  "XOF",
    "product:availability":    availability,
    "product:condition":       "new",
    "product:retailer_item_id": product._api?.sku || String(product._api?.id ?? product.id),
    "product:category":        product.categoryName,
    "product:brand":           product._api?.brand?.name ?? product.vendorName,
  },
};
```

**Règles** :
- `product:price:amount` doit être un entier sans décimales (XOF n'a pas de centimes)
- `product:retailer_item_id` doit correspondre exactement à l'ID dans le catalogue Facebook
- Ne pas mettre de symbole dans `product:price:currency` — uniquement le code ISO 4217 (`XOF`)

### Tests
- `curl -s https://sugu.pro/product/[slug] | grep 'product:'` → valider les balises
- Facebook Sharing Debugger → onglet "Open Graph Tags"
- Facebook Catalog Manager → tester l'import via URL

---

## TICKET P3 — Intégrer le Facebook / Meta Pixel

### Contexte
Sans le Pixel, aucun retargeting ni optimisation des pubs n'est possible. L'événement `ViewContent` doit se déclencher à chaque visite de page produit.

### Frontend

**Créer `src/components/analytics/FacebookPixel.tsx`** :

```typescript
"use client";

import Script from "next/script";
import { useEffect } from "react";

interface FacebookPixelProps {
  pixelId: string;
  // Données pour l'événement ViewContent
  contentId: string;
  contentName: string;
  contentCategory: string;
  value: number;
  currency?: string;
}

export function FacebookPixel({
  pixelId,
  contentId,
  contentName,
  contentCategory,
  value,
  currency = "XOF",
}: FacebookPixelProps) {
  useEffect(() => {
    // Déclencher ViewContent après hydratation
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "ViewContent", {
        content_ids: [contentId],
        content_type: "product",
        content_name: contentName,
        content_category: contentCategory,
        value,
        currency,
      });
    }
  }, [contentId, contentName, contentCategory, value, currency]);

  return (
    <Script
      id="facebook-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
  );
}

// Type global pour TypeScript
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}
```

**Créer `src/lib/constants.ts` — ajouter la constante Pixel** :

```typescript
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";
```

**Fichier `.env.local` — ajouter** :
```
NEXT_PUBLIC_META_PIXEL_ID=your_pixel_id_here
```

**Fichier `page.tsx` — utiliser le composant** :

Dans le return JSX, après le JSON-LD :

```tsx
{process.env.NEXT_PUBLIC_META_PIXEL_ID && (
  <FacebookPixel
    pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
    contentId={product._api?.sku || String(product._api?.id ?? product.id)}
    contentName={product.name}
    contentCategory={product.categoryName}
    value={product.price}
    currency="XOF"
  />
)}
```

**Ajouter les événements AddToCart** dans `ProductActions.tsx` :

Après l'appel `addToCart(...)`, ajouter :

```typescript
if (typeof window !== "undefined" && window.fbq) {
  window.fbq("track", "AddToCart", {
    content_ids: [variantId || productId],
    content_type: "product",
    value: currentPrice,
    currency: "XOF",
    num_items: qty,
  });
}
```

### Tests
- Installer l'extension Chrome **Meta Pixel Helper**
- Naviguer vers `/product/[slug]` → vérifier que `ViewContent` apparaît en vert
- Cliquer "Ajouter au panier" → vérifier `AddToCart`
- Facebook Events Manager → onglet "Test Events" en temps réel

---

## TICKET P4 — Nettoyer la description OG (strip HTML)

### Contexte
`product.description` contient du HTML brut (`description_html`). Si `seo.description` est vide, la description OG et Twitter contiendront des balises `<p>`, `<strong>`, etc.

### Frontend

**Créer `src/lib/html-utils.ts`** :

```typescript
/**
 * Strip HTML tags from a string and truncate to the given length.
 * Safe to use in Server Components (no DOM dependency).
 */
export function stripHtml(html: string, maxLength = 155): string {
  // Remove all HTML tags using regex (server-safe, no DOMParser)
  const text = html
    .replace(/<[^>]+>/g, " ")   // remplace les balises par un espace
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, " ")    // collapse multiple spaces
    .trim();

  if (text.length <= maxLength) return text;
  // Truncate at word boundary
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
```

**Fichier `page.tsx`** — utiliser `stripHtml` dans `generateMetadata` :

```typescript
import { stripHtml } from "@/lib/html-utils";

// Dans generateMetadata :
const rawDescription = product._api?.seo?.description ?? product._api?.short_description ?? product.description ?? "";
const plainDescription = stripHtml(rawDescription, 155);

return createMetadata({
  title: product._api?.seo?.title ?? product.name,
  description: plainDescription,  // ← texte propre garanti
  path: `/product/${slug}`,
  image: product.thumbnail,
  type: "product",
});
```

### Tests
- `curl -s https://sugu.pro/product/[slug] | grep 'og:description'`
  → La valeur ne doit contenir aucun `<`, `>`, ou entité HTML

---

## TICKET P5 — `generateStaticParams` pour les top produits

### Contexte
Sans `generateStaticParams`, chaque page `/product/[slug]` est rendue de novo côté serveur à chaque requête → TTFB élevé, mauvais Lighthouse, crawl plus lent.

### Backend (../sugu) — Créer un endpoint `/api/v1/products/top-slugs`

Dans le contrôleur produit (ex: `ProductController.php`), ajouter :

```php
/**
 * @GET /api/v1/products/top-slugs
 * Returns the slugs of the N most visited/best-seller products for static generation.
 * Cached for 1 hour.
 */
public function topSlugs(Request $request): JsonResponse
{
    $limit = min((int) $request->query('limit', 200), 500);

    $slugs = Cache::remember("products:top-slugs:{$limit}", 3600, function () use ($limit) {
        return Product::query()
            ->where('status', ProductStatus::Active)
            ->orderByDesc('view_count')  // ou orderByDesc('sales_count')
            ->limit($limit)
            ->pluck('slug');
    });

    return response()->json([
        'success' => true,
        'slugs'   => $slugs,
    ]);
}
```

Ajouter la route (public, no auth) :
```php
Route::get('/products/top-slugs', [ProductController::class, 'topSlugs']);
```

### Frontend — `page.tsx`

```typescript
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/top-slugs?limit=200`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.slugs as string[]).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

// Indispensable avec generateStaticParams pour ne pas bloquer sur les slugs inconnus
export const dynamicParams = true;
```

**Règles** :
- `dynamicParams = true` est obligatoire pour que les slugs hors liste soient quand même rendus dynamiquement
- Limiter à 200 slugs max pour ne pas ralentir le build

### Tests
- `npm run build` → vérifier dans les logs Next.js que des pages `/product/[slug]` apparaissent comme "SSG" (●) et non uniquement comme "SSR" (λ)

---

## TICKET P6 — Cache-Control pour `/product/*` (Cloudflare)

### Contexte
`next.config.ts` ne définit un header `Cache-Control` explicite que pour `/`. Cloudflare ne sait pas combien de temps mettre les pages produit en cache.

### Frontend — `next.config.ts`

Dans le tableau `headers()`, ajouter après la règle pour `/` :

```typescript
{
  // Pages produit — ISR 120s + stale-while-revalidate 10 min
  source: "/product/:slug*",
  headers: [
    {
      key: "Cache-Control",
      value: "public, s-maxage=120, stale-while-revalidate=600",
    },
    {
      key: "CDN-Cache-Control",
      value: "public, max-age=120, stale-while-revalidate=600",
    },
    {
      key: "Surrogate-Control",
      value: "max-age=120",
    },
  ],
},
```

**Règle** : La valeur `s-maxage=120` doit correspondre au `CACHE_TTL = 120` du `ProductDetailService.php` backend.

### Tests
- `curl -I https://sugu.pro/product/[slug]` → vérifier le header `Cache-Control`
- Cloudflare Dashboard → Analytics → Cache Hit Rate (doit monter)

---

## TICKET P7 — Corriger le JSON-LD (`Brand` + `BreadcrumbList` + `priceValidUntil`)

### Contexte
Le JSON-LD utilise `@type: "Organization"` pour la brand (devrait être `"Brand"`), n'inclut pas le breadcrumb structuré, et ne précise pas `priceValidUntil` pour les promos.

### Frontend — `page.tsx`

Remplacer le bloc `<script type="application/ld+json">` par :

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify([
      // ── Schema 1: Product ────────────────────────────
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: stripHtml(product.description ?? "", 500),
        image: product.images.map((img) => img.url),
        sku: product._api?.sku || undefined,
        mpn: product._api?.sku || undefined,
        brand: {
          "@type": "Brand",  // ← corrigé
          name: product._api?.brand?.name ?? product.vendorName,
        },
        offers: {
          "@type": "Offer",
          url: `https://sugu.pro/product/${product.slug}`,
          priceCurrency: "XOF",
          price: product.price,
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          priceValidUntil: product.promoEndsAt
            ? product.promoEndsAt.slice(0, 10)  // format YYYY-MM-DD
            : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          seller: {
            "@type": "Organization",
            name: product.vendorName,
            url: product.vendorSlug
              ? `https://sugu.pro/store/${product.vendorSlug}`
              : "https://sugu.pro",
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
      // ── Schema 2: BreadcrumbList ─────────────────────
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: "https://sugu.pro",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: product.categoryName,
            item: `https://sugu.pro/category/${product._api?.category?.slug ?? ""}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.name,
            item: `https://sugu.pro/product/${product.slug}`,
          },
        ],
      },
    ]),
  }}
/>
```

### Tests
- Google Rich Results Test : https://search.google.com/test/rich-results → URL de la page
- Schema Markup Validator : https://validator.schema.org/
- Vérifier que "Product" et "Breadcrumb" apparaissent tous les deux comme valides

---

## TICKET P8 — Sitemap dynamique

### Contexte
Sans sitemap, Google doit découvrir les pages produit par le crawl de liens internes uniquement — indexation très lente.

### Backend (../sugu) — Endpoint `/api/v1/products/sitemap`

```php
/**
 * @GET /api/v1/products/sitemap
 * Returns all active product slugs with their last update date for sitemap generation.
 */
public function sitemap(): JsonResponse
{
    $products = Cache::remember('products:sitemap', 3600, function () {
        return Product::query()
            ->where('status', ProductStatus::Active)
            ->select(['slug', 'updated_at'])
            ->orderByDesc('updated_at')
            ->get()
            ->map(fn($p) => [
                'slug'       => $p->slug,
                'updated_at' => $p->updated_at?->toISOString(),
            ]);
    });

    return response()->json([
        'success'  => true,
        'products' => $products,
    ]);
}
```

Ajouter la route :
```php
Route::get('/products/sitemap', [ProductController::class, 'sitemap']);
```

### Frontend — `src/app/sitemap.ts`

```typescript
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrls: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/sitemap`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) return baseUrls;

    const data = await res.json();
    const productUrls: MetadataRoute.Sitemap = (
      data.products as Array<{ slug: string; updated_at: string }>
    ).map(({ slug, updated_at }) => ({
      url: `${SITE_URL}/product/${slug}`,
      lastModified: new Date(updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...baseUrls, ...productUrls];
  } catch {
    return baseUrls;
  }
}
```

### Tests
- `curl https://sugu.pro/sitemap.xml` → vérifier que les URLs `/product/` apparaissent
- Google Search Console → Sitemaps → soumettre `https://sugu.pro/sitemap.xml`

---

## TICKET P9 — Image OG optimisée 1200×630

### Contexte
Les publicités Facebook nécessitent une image OG au format 1.91:1 (idéalement 1200×630). La photo produit brute est carrée et sera mal cadrée.

### Option A (recommandée) — Cloudflare Image Resizing

Si Cloudflare Image Resizing est activé sur le domaine, utiliser des paramètres d'URL :

**Créer `src/lib/og-image.ts`** :

```typescript
/**
 * Generate an OG-optimized image URL for Facebook Ads (1200×630).
 * Uses Cloudflare Image Resizing if the image is on cdn.sugu.pro.
 */
export function buildOgImageUrl(rawUrl: string | undefined): string {
  const fallback = "https://sugu.pro/og-default.png";
  if (!rawUrl) return fallback;

  // Only transform CDN images
  if (!rawUrl.includes("cdn.sugu.pro") && !rawUrl.includes("api.mysugu.com")) {
    return rawUrl;
  }

  // Cloudflare image resizing via /cdn-cgi/image/
  const encoded = encodeURIComponent(rawUrl);
  return `https://sugu.pro/cdn-cgi/image/width=1200,height=630,fit=cover,format=auto/${encoded}`;
}
```

**Utiliser dans `page.tsx`** :

```typescript
import { buildOgImageUrl } from "@/lib/og-image";

// Dans generateMetadata :
return createMetadata({
  title: ...,
  description: plainDescription,
  path: `/product/${slug}`,
  image: buildOgImageUrl(product.thumbnail),  // ← OG image 1200×630
  type: "product",
});
```

### Option B — Endpoint `/api/og` via `@vercel/og`

Si Cloudflare Image Resizing n'est pas disponible, créer un endpoint OG dynamique :

**`src/app/api/og/route.tsx`** :

```tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Produit";
  const price = searchParams.get("price") ?? "";
  const image = searchParams.get("image") ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          alignItems: "center",
          padding: 60,
          gap: 60,
        }}
      >
        {image && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={image} width={400} height={400} style={{ objectFit: "contain", borderRadius: 20 }} alt="" />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
          <div style={{ color: "#F15412", fontSize: 24, fontWeight: 700 }}>SUGU.PRO</div>
          <div style={{ color: "white", fontSize: 48, fontWeight: 800, lineHeight: 1.2 }}>{title}</div>
          {price && <div style={{ color: "#F15412", fontSize: 36, fontWeight: 700 }}>{price} FCFA</div>}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

Utiliser dans `page.tsx` :

```typescript
image: `/api/og?title=${encodeURIComponent(product.name)}&price=${product.price}&image=${encodeURIComponent(product.thumbnail)}`,
```

### Tests
- Facebook Sharing Debugger → vérifier que `og:image:width = 1200` et `og:image:height = 630`
- Tester visuellement l'aperçu de partage avec le debugger

---

## TICKET P10 — Meta Conversions API (CAPI) côté Laravel

### Contexte
iOS 14+ et les bloqueurs de pub empêchent le Pixel de capter 30–40% des événements. Le CAPI envoie les événements directement depuis le serveur.

### Backend (../sugu)

**Installer le SDK Facebook** :
```bash
composer require facebook/php-business-sdk
```

**Créer `app/Services/Meta/MetaConversionsService.php`** :

```php
<?php

namespace App\Services\Meta;

use FacebookAds\Api;
use FacebookAds\Object\ServerSide\EventRequest;
use FacebookAds\Object\ServerSide\Event;
use FacebookAds\Object\ServerSide\UserData;
use FacebookAds\Object\ServerSide\Content;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class MetaConversionsService
{
    private string $pixelId;
    private string $accessToken;

    public function __construct()
    {
        $this->pixelId = config('services.meta.pixel_id');
        $this->accessToken = config('services.meta.access_token');
        Api::init(null, null, $this->accessToken);
    }

    /**
     * Send a ViewContent event to Meta CAPI.
     */
    public function sendViewContent(
        Request $request,
        string $productId,
        string $productName,
        string $category,
        int $price,
        ?string $userId = null
    ): void {
        try {
            $userData = (new UserData())
                ->setClientIpAddress($request->ip())
                ->setClientUserAgent($request->userAgent())
                ->setFbp($request->cookie('_fbp'))
                ->setFbc($request->cookie('_fbc'));

            if ($userId) {
                $userData->setExternalId(hash('sha256', $userId));
            }

            $content = (new Content())
                ->setProductId($productId)
                ->setItemPrice($price / 100)  // XOF en unités principales
                ->setQuantity(1);

            $event = (new Event())
                ->setEventName('ViewContent')
                ->setEventTime(time())
                ->setActionSource('website')
                ->setEventSourceUrl($request->fullUrl())
                ->setUserData($userData)
                ->setContents([$content])
                ->setCustomData(
                    (new \FacebookAds\Object\ServerSide\CustomData())
                        ->setCurrency('XOF')
                        ->setValue($price / 100)
                        ->setContentType('product')
                        ->setContentIds([$productId])
                        ->setContentName($productName)
                        ->setContentCategory($category)
                );

            $eventRequest = (new EventRequest($this->pixelId))
                ->setEvents([$event]);

            $eventRequest->execute();
        } catch (\Throwable $e) {
            Log::warning('[CAPI] ViewContent failed', ['error' => $e->getMessage()]);
        }
    }
}
```

**Créer `app/Http/Controllers/Api/V1/MetaEventsController.php`** :

Exposer un endpoint que le frontend peut appeler après l'hydratation :

```php
Route::post('/meta/events', [MetaEventsController::class, 'store'])->middleware('throttle:60,1');
```

**Ajouter dans `config/services.php`** :
```php
'meta' => [
    'pixel_id'     => env('META_PIXEL_ID'),
    'access_token' => env('META_CAPI_ACCESS_TOKEN'),
],
```

**`.env`** :
```
META_PIXEL_ID=your_pixel_id
META_CAPI_ACCESS_TOKEN=your_system_user_access_token
```

### Tests
- Facebook Events Manager → onglet "Test Events" → cliquer sur un produit → les événements CAPI apparaissent avec le label "Server"
- Vérifier le **Event Match Quality** (EMQ) → viser 7+/10

---

## TICKET P11 — robots.txt

### Contexte
Sans `robots.txt`, certains bots pourraient crawler des pages non-indexables.

### Frontend — `src/app/robots.ts`

```typescript
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/account/",
          "/cart",
          "/checkout/",
          "/messages/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
```

### Tests
- `curl https://sugu.pro/robots.txt` → vérifier la présence du sitemap et des règles

---

## Ordre d'exécution recommandé

```
P1 (og:type) → P4 (strip HTML) → P2 (product tags OG) → P3 (Pixel)
     ↓
P7 (JSON-LD) → P6 (Cache-Control) → P8 (sitemap) → P11 (robots.txt)
     ↓
P5 (generateStaticParams) → P9 (og image) → P10 (CAPI)
```

Les tickets P1 à P4 **doivent** être livrés ensemble dans le même PR (ils sont interdépendants pour la validation via Facebook Debugger).

---

## Checklist de validation finale

- [ ] `og:type = product` présent dans le `<head>`
- [ ] `product:price:amount` et `product:price:currency` présents
- [ ] `product:availability` correct (in stock / out of stock selon stock réel)
- [ ] `product:retailer_item_id` correspond à l'ID du catalogue Facebook
- [ ] `og:description` sans balises HTML
- [ ] `og:image` en 1200×630
- [ ] Facebook Pixel `ViewContent` déclenché à chaque vue
- [ ] Facebook Pixel `AddToCart` déclenché à l'ajout panier
- [ ] JSON-LD `Product` valide (Google Rich Results Test = ✅)
- [ ] JSON-LD `BreadcrumbList` valide
- [ ] `priceValidUntil` présent dans les offers
- [ ] `sitemap.xml` accessible et indexé dans Search Console
- [ ] `robots.txt` configuré
- [ ] Cache-Control `s-maxage=120` sur les pages produit
- [ ] Build Next.js génère des pages statiques pour les top produits
- [ ] Lighthouse SEO score ≥ 95
