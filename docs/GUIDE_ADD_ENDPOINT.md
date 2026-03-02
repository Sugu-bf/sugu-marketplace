# Guide : Ajouter un endpoint proprement

> Ce guide explique comment consommer un nouvel endpoint backend dans le frontend SUGU.

---

## Étape 1 — Identifier l'endpoint backend

Ouvrir `../sugu/routes/api_v1.php` et le sous-fichier de routes concerné.
Identifier :
- **Méthode HTTP** (GET, POST, PUT, DELETE)
- **Path** complet (ex: `/api/v1/public/products`)
- **Paramètres** attendus (query params, body)
- **Réponse** (inspecter le Controller + Resource Laravel)

## Étape 2 — Créer les types et schemas Zod

Dans `src/features/<domain>/schemas.ts` :

```typescript
// src/features/product/schemas.ts
import { z } from "zod";

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  image: z.string().nullable(),
});

export type Product = z.infer<typeof ProductSchema>;
```

## Étape 3 — Créer la fonction API dans le feature

Dans `src/features/<domain>/api.ts` :

```typescript
// src/features/product/api.ts
import { z } from "zod";
import { api, v1Url, CacheTags, RevalidatePresets } from "@/lib/api";
import { ProductSchema } from "./schemas";

const ProductsResponseSchema = z.object({
  data: z.array(ProductSchema),
  meta: z.object({ total: z.number() }),
});

export async function fetchProducts(page = 1): Promise<Product[]> {
  try {
    const { data } = await api.get(v1Url("public/products", { page }), {
      schema: ProductsResponseSchema,
      revalidate: RevalidatePresets.standard,
      tags: [CacheTags.products()],
    });
    return data.data;
  } catch (error) {
    console.error("[Products] Fetch failed:", (error as Error).message);
    return [];
  }
}
```

### Règles obligatoires :
- ✅ **Toujours** utiliser `api.get/post/put/delete` de `@/lib/api`
- ✅ **Toujours** construire les URLs via `v1Url()`, `publicUrl()`, ou `meUrl()`
- ✅ **Ajouter** un schema Zod pour validation runtime (sauf endpoints triviaux)
- ✅ **Définir** `revalidate` et `tags` pour les endpoints publics (SSR cache)
- ✅ **Mettre `revalidate: 0`** pour les données user-specific (cart, account)
- ❌ **Jamais** de `fetch()` direct dans un composant ou page
- ❌ **Jamais** d'URL localhost

## Étape 4 — Intégrer dans les queries

Dans `src/features/<domain>/queries/<domain>-queries.ts` :

```typescript
import { fetchProducts } from "../api";

export async function queryProducts(page = 1) {
  return fetchProducts(page);
}
```

## Étape 5 — Utiliser dans une page (SSR)

```tsx
// src/app/(main)/products/page.tsx
import { queryProducts } from "@/features/product";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Produits",
  path: "/products",
});

export default async function ProductsPage() {
  const products = await queryProducts();
  return <ProductGrid products={products} />;
}
```

## Étape 6 — Invalider le cache si nécessaire

Lors d'une mutation (ajout au panier, mise à jour profil) :

```typescript
import { invalidateTags, CacheTags } from "@/lib/api";

// Après un ajout au panier réussi :
invalidateTags([CacheTags.cart()]);
```

---

## Résumé de l'architecture API

```
src/lib/api/
├── client.ts       ← Wrapper fetch central (GET/POST/PUT/PATCH/DELETE)
├── config.ts       ← API_BASE_URL + garde-fous (jamais localhost)
├── endpoints.ts    ← URL builders (buildApiUrl, v1Url, publicUrl, meUrl)
├── errors.ts       ← ApiError class normalisée
├── cache.ts        ← Tags de cache + invalidation
├── auth.ts         ← Sanctum CSRF + session
├── schemas/        ← Zod schemas partagés (pagination, media, etc.)
└── index.ts        ← Barrel export

src/features/<domain>/
├── api.ts          ← Fonctions API métier (fetchProducts, etc.)
├── schemas.ts      ← Zod schemas spécifiques au domaine
├── queries/        ← Entry points pour les pages
├── models/         ← Types inférés des schemas
├── services/       ← Mock (dev) ou API (prod) implementations
└── index.ts        ← Barrel export
```
