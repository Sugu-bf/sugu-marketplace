# SUGU Marketplace — Architecture Frontend

> Ce document est la **source de vérité** de l'architecture frontend Next.js.
> Tout développeur (humain ou IA) **DOIT** le lire avant de créer ou modifier une page.

---

## Table des matières

1. [Stack technique](#1-stack-technique)
2. [Structure des dossiers](#2-structure-des-dossiers)
3. [Conventions SSR / Client](#3-conventions-ssr--client)
4. [Système de design (Tokens)](#4-système-de-design-tokens)
5. [Composants — UI Kit](#5-composants--ui-kit)
6. [Features (domaines métier)](#6-features-domaines-métier)
7. [Standards SEO](#7-standards-seo)
8. [Standards Performance](#8-standards-performance)
9. [Standards Accessibilité (a11y)](#9-standards-accessibilité-a11y)
10. [Convention d'images](#10-convention-dimages)
11. [Routes & Pages](#11-routes--pages)
12. [Checklist — Créer une nouvelle page](#12-checklist--créer-une-nouvelle-page)
13. [Checklist — Créer un nouveau composant](#13-checklist--créer-un-nouveau-composant)

---

## 1. Stack technique

| Outil                    | Rôle                                       |
| ------------------------ | ------------------------------------------ |
| **Next.js 16**           | Framework React (App Router, SSR)          |
| **React 19**             | UI library                                 |
| **TypeScript (strict)**  | Typage                                     |
| **Tailwind CSS v4**      | Styles utilitaires                         |
| **tailwind-merge + clsx**| Classe CSS sans conflits (`cn()`)          |
| **class-variance-authority (CVA)** | Variants de composants           |
| **lucide-react**         | Icônes                                     |
| **framer-motion**        | Animations (chargement lazy si lourd)      |
| **zustand**              | State client minimal (cart, UI)            |
| **@tanstack/react-query**| Préparé pour les appels API futurs         |
| **zod**                  | Schémas / validation runtime               |
| **next/font (Inter)**    | Typographie optimisée                      |
| **next/image**           | Images optimisées                          |

---

## 2. Structure des dossiers

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Layout auth (sans Header/Footer)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (main)/                   # Layout principal (Header + Footer)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Home (/)
│   │   ├── loading.tsx           # Skeleton de la Home
│   │   ├── search/page.tsx
│   │   ├── banners/page.tsx
│   │   ├── category/[slug]/page.tsx
│   │   ├── product/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── track-order/page.tsx
│   │   └── account/
│   │       ├── page.tsx
│   │       └── addresses/page.tsx
│   ├── layout.tsx                # Root layout (html, body, fonts, metadata)
│   ├── not-found.tsx             # 404 personnalisé
│   └── globals.css               # Design tokens + animations + utilitaires
│
├── components/
│   ├── ui/                       # UI Kit réutilisable (atoms/molecules)
│   │   ├── index.ts              # Barrel export
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── badge.tsx
│   │   ├── card.tsx
│   │   ├── skeleton.tsx
│   │   ├── modal.tsx
│   │   ├── dropdown.tsx
│   │   ├── tabs.tsx
│   │   ├── section-header.tsx
│   │   └── container.tsx
│   │
│   ├── Header.tsx                # Header existant (client)
│   ├── Footer.tsx                # Footer existant (client)
│   ├── CategoryBar.tsx           # Section categories
│   ├── HeroBanners.tsx           # Carousel héro
│   ├── BestSeller.tsx            # Section best sellers
│   └── ...                       # Autres sections home
│
├── features/                     # Domaines métier
│   ├── product/
│   │   ├── models/product.ts     # Schémas Zod + types
│   │   ├── mocks/products.ts     # Fixtures design-only
│   │   ├── repositories/product-repository.ts  # Interface
│   │   ├── services/product-service.ts         # Impl mock
│   │   ├── queries/product-queries.ts          # Entry point data
│   │   └── index.ts
│   ├── category/                 # Même structure
│   ├── cart/
│   │   ├── models/cart.ts
│   │   ├── store/cart-store.ts   # Zustand store
│   │   └── index.ts
│   ├── auth/
│   │   ├── models/auth.ts       # Login/Register schemas
│   │   └── index.ts
│   ├── account/
│   │   ├── models/account.ts    # Address, Order schemas
│   │   ├── mocks/account.ts
│   │   └── index.ts
│   └── checkout/
│       ├── models/checkout.ts
│       └── index.ts
│
├── lib/                          # Utilitaires partagés
│   ├── utils.ts                  # cn() — clsx + tailwind-merge
│   ├── constants.ts              # SITE_NAME, CDN_URL, formatPrice, etc.
│   ├── metadata.ts               # createMetadata() — SEO factory
│   └── fonts.ts                  # next/font configuration
│
└── docs/
    ├── ARCHITECTURE_FRONTEND.md  # Ce fichier
    └── IMPLEMENTATION_RULES.md   # Règles d'or
```

### Conventions de nommage

| Cible           | Convention         | Exemple                    |
| --------------- | ------------------ | -------------------------- |
| Composants      | PascalCase         | `ProductCard.tsx`          |
| UI Kit          | kebab-case         | `section-header.tsx`       |
| Features        | kebab-case dossier | `features/product/`        |
| Types/Schemas   | PascalCase         | `ProductSchema`            |
| Fonctions query | camelCase `query*` | `queryFeaturedProducts()`  |
| CSS variables   | kebab-case         | `--color-primary`          |

---

## 3. Conventions SSR / Client

### Règle générale

> **Tout composant est Server Component par défaut.**
> `"use client"` uniquement si le composant utilise :
> - `useState`, `useEffect`, `useRef` (React hooks)
> - Événements utilisateur (`onClick`, `onChange`, `onSubmit`)
> - API navigateur (`window`, `document`, `IntersectionObserver`)
> - Bibliothèques client-only (framer-motion, zustand, swiper)

### Pattern d'assemblage

```
Page (Server) ──► Lit les données via queries/
                  ──► Passe les props aux composants
                      ──► Composant Server si possible
                      ──► Composant Client si interaction requise
```

```tsx
// src/app/(main)/page.tsx — SERVER COMPONENT
import { queryFeaturedProducts } from "@/features/product";
import ProductGrid from "./components/ProductGrid"; // client si scroll

export default async function Page() {
  const products = await queryFeaturedProducts(6);
  return <ProductGrid products={products} />;
}
```

### Accès aux données

- ❌ **JAMAIS** de fetch/API directement dans un composant UI
- ❌ **JAMAIS** d'import de mocks dans un composant UI
- ✅ Les pages appellent les fonctions `query*()` depuis `features/*/queries/`
- ✅ Les queries instancient le service et retournent les données
- ✅ Quand l'API sera prête : on swap le service, les queries et composants ne changent pas

---

## 4. Système de design (Tokens)

### Couleurs principales

| Token CSS               | Valeur    | Utilisation          |
| ----------------------- | --------- | -------------------- |
| `--color-primary`       | `#F15412` | CTA, accents, marque |
| `--color-primary-dark`  | `#D4450B` | Hover sur primary    |
| `--color-primary-50`    | `#FFF4EE` | Fond léger           |
| `--color-primary-100`   | `#FFE5D6` | Fond badge           |
| `--color-accent`        | `#F5C451` | CTA secondaire       |
| `--color-background`    | `#FFFFFF` | Fond principal       |
| `--color-foreground`    | `#171717` | Texte principal      |
| `--color-muted`         | `#F5F5F5` | Fond secondaire      |
| `--color-border`        | `#E5E5E5` | Bordures             |

### Usage Tailwind

```tsx
// ✅ Utiliser les tokens Tailwind
<div className="bg-primary text-white hover:bg-primary-dark" />
<div className="bg-primary-50 text-primary" />
<div className="border-border bg-background" />

// ❌ NE PAS hardcoder les couleurs
<div className="bg-[#F15412]" />
```

### Typographie

- Police principale : **Inter** via `next/font/google`
- Variable CSS : `--font-inter`
- Tailwind : `font-sans` (résolue via `@theme inline`)

### Utilitaire cn()

```tsx
import { cn } from "@/lib/utils";

// Merge sans conflits, conditions, etc.
<div className={cn("px-4 py-2", isActive && "bg-primary text-white", className)} />
```

---

## 5. Composants — UI Kit

Tous dans `src/components/ui/`. Import via barrel :

```tsx
import { Button, Input, Badge, Card, Skeleton } from "@/components/ui";
```

### Composants disponibles

| Composant       | Variants (CVA)                    | Client ? |
| --------------- | --------------------------------- | -------- |
| `Button`        | primary, secondary, outline, ghost, accent, danger, link × xs…xl + icon | Non (sauf onClick) |
| `Input`         | sm, md, lg × default, filled, error | Non (sauf onChange) |
| `Textarea`      | —                                 | Oui      |
| `Badge`         | primary, secondary, success, warning, danger, muted × xs…lg | Non |
| `Card`          | hoverable                         | Non      |
| `Skeleton`      | circle                            | Non      |
| `Modal`         | sm, md, lg, xl, full              | Oui      |
| `Dropdown`      | align: left, right                | Oui      |
| `Tabs`          | —                                 | Oui      |
| `SectionHeader` | —                                 | Non      |
| `Container`     | narrow                            | Non      |

### Avant de créer un composant

1. Vérifier si un composant UI Kit couvre le besoin
2. Vérifier les composants existants dans `components/`
3. Si le composant est purement visuel → Server Component
4. Si interaction requise → `"use client"` au minimum nécessaire

---

## 6. Features (domaines métier)

Chaque feature suit la structure :

```
features/
└── product/
    ├── models/       # Schemas Zod + types TS inférés
    ├── mocks/        # Données de test (design-only)
    ├── repositories/ # Interface du contrat d'accès aux données
    ├── services/     # Implémentation (Mock* maintenant, Api* plus tard)
    ├── queries/      # Fonctions d'entrée pour les pages
    ├── components/   # Composants métier spécifiques (si nécessaire)
    └── index.ts      # Barrel export public
```

### Règles

- Les **schémas Zod** définissent la forme des données ET génèrent les types TypeScript
- Les **repositories** sont des interfaces pures (pas d'implémentation)
- Les **services** implémentent les repositories
- Les **queries** sont les seules fonctions que les pages/composants importent
- Les **mocks** ne sont jamais importées directement dans un composant UI

---

## 7. Standards SEO

### Metadata par page

```tsx
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Mon Panier",
  description: "Consultez votre panier d'achat sur Sugu.",
  path: "/cart",
  noIndex: true, // pages privées
});
```

### Pages dynamiques

```tsx
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return createMetadata({ title: slug, path: `/product/${slug}` });
}
```

### Checklist SEO

- [x] `<html lang="fr">`
- [x] `<title>` unique par page (template: `{Page} | Sugu`)
- [x] `<meta name="description">` unique par page
- [x] OpenGraph complet (title, description, image, url)
- [x] Twitter Card (summary_large_image)
- [x] noIndex sur les pages privées (checkout, account, etc.)
- [x] Heading hierarchy : un seul `<h1>` par page
- [x] HTML sémantique (`<main>`, `<section>`, `<nav>`, `<footer>`, `<article>`)
- [ ] JSON-LD (à ajouter pour Product et Organization)
- [ ] Sitemap (via next-sitemap)

---

## 8. Standards Performance

### Images

- Toujours `next/image` — jamais de `<img>`
- Props obligatoires : `alt`, `sizes` (calculé), `priority` (LCP uniquement)
- Format : avif/webp automatique via config
- Remote patterns : `cdn.sugu.pro` configuré

### Bundle

- SSR par défaut → pas de JS client si pas nécessaire
- `"use client"` au plus bas possible dans l'arbre
- Dynamic imports pour composants lourds :
  ```tsx
  const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
    loading: () => <Skeleton className="h-40" />,
  });
  ```

### Loading states

- Chaque route doit avoir un `loading.tsx` avec des `<Skeleton>`
- Les skeletons doivent refléter la structure réelle de la page

### Anti-patterns

- ❌ Pas de `useEffect(() => setLoaded(true), [])` pour les animations d'entrée
  - ✅ Utiliser les animations CSS ou framer-motion avec `initial`/`animate`
- ❌ Pas de re-renders causés par un state qui ne change pas le rendu
- ❌ Pas de dépendances npm non utilisées

---

## 9. Standards Accessibilité (a11y)

| Exigence             | Implémentation                          |
| -------------------- | --------------------------------------- |
| Focus visible        | `*:focus-visible` ring primary          |
| Aria labels          | Tous les boutons icône                  |
| Rôles ARIA           | tablist/tab/tabpanel, menu/menuitem     |
| Aria-invalid         | Champs de formulaire en erreur          |
| Aria-describedby     | Messages d'erreur liés                  |
| Contrastes           | Respecter WCAG AA (4.5:1 texte)         |
| Headings             | Hiérarchie correcte (h1 > h2 > h3)     |
| Navigation clavier   | Tab, Escape (modals, dropdowns)         |
| Skip to content      | À ajouter si nécessaire                |

---

## 10. Convention d'images

### Structure

```
public/
├── banners/          # Bannières hero, promotions
├── brands/           # Logos marques
├── categories/       # Thumbnails catégories
├── products/         # Photos produits
├── promos/           # Images promotionnelles
└── logo.png          # Logo Sugu
```

### Règles

1. Images locales dans `public/` — les images CDN utilisent `cdn.sugu.pro`
2. Toujours `next/image` avec `alt` descriptif
3. `sizes` calculé selon le layout (ex: `"(max-width: 640px) 100vw, 33vw"`)
4. `priority` uniquement pour les images above-the-fold (LCP)
5. Utiliser `fill` + `object-cover` pour les images de taille variable

---

## 11. Routes & Pages

| Route                       | Page                  | Layout   | SEO Index |
| --------------------------- | --------------------- | -------- | --------- |
| `/`                         | Home                  | (main)   | ✅         |
| `/login`                    | Connexion             | (auth)   | ❌         |
| `/onboarding`               | Inscription           | (auth)   | ❌         |
| `/search`                   | Recherche             | (main)   | ✅         |
| `/banners`                  | Promotions            | (main)   | ✅         |
| `/category/[slug]`          | Catégorie             | (main)   | ✅         |
| `/product/[slug]`           | Fiche produit         | (main)   | ✅         |
| `/cart`                     | Panier                | (main)   | ❌         |
| `/checkout`                 | Paiement              | (main)   | ❌         |
| `/track-order`              | Suivi commande        | (main)   | ❌         |
| `/account`                  | Mon compte            | (main)   | ❌         |
| `/account/addresses`        | Mes adresses          | (main)   | ❌         |

---

## 12. Checklist — Créer une nouvelle page

```
□ 1. Lire ce document (ARCHITECTURE_FRONTEND.md)
□ 2. Lire docs/IMPLEMENTATION_RULES.md
□ 3. Identifier le route group ((main) ou (auth))
□ 4. Créer le fichier page.tsx dans le bon dossier
□ 5. Exporter `metadata` via createMetadata()
□ 6. La page est un Server Component (pas de "use client")
□ 7. Si données requises → appeler query*() depuis features/
□ 8. Si interaction client → extraire dans un composant client minimal
□ 9. Vérifier les composants UI Kit existants avant d'en créer
□ 10. Créer loading.tsx avec des Skeletons fidèles au layout
□ 11. Un seul <h1> par page
□ 12. HTML sémantique (<section>, <article>, <nav>)
□ 13. Images via next/image avec alt + sizes
□ 14. Tester : npm run build (pas d'erreurs TS)
```

---

## 13. Checklist — Créer un nouveau composant

```
□ 1. Vérifier qu'il n'existe pas déjà (UI Kit ou components/)
□ 2. Server Component par défaut
□ 3. "use client" seulement si interaction/hooks nécessaires
□ 4. Utiliser cn() pour les classes conditionnelles
□ 5. Utiliser les design tokens (pas de couleurs hardcodées)
□ 6. Props typées avec TypeScript
□ 7. Si variants → utiliser CVA
□ 8. Si formulaire → aria-invalid, aria-describedby
□ 9. Si bouton icône → aria-label
□ 10. Pas de données dans le composant (les données viennent des props ou queries)
```

---

*Dernière mise à jour : 22 février 2026*
