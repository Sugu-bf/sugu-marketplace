<p align="center">
  <img src="public/logo.png" alt="SUGU Marketplace" width="200" />
</p>

<h1 align="center">🛒 SUGU Marketplace</h1>

<p align="center">
  <strong>La marketplace africaine nouvelle génération — rapide, moderne et accessible.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.2.0-blue?style=for-the-badge&logo=semver&logoColor=white" alt="Version" />
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/license-Proprietary-red?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/SSR-enabled-success?style=flat-square&logo=vercel" alt="SSR Enabled" />
  <img src="https://img.shields.io/badge/a11y-WCAG_AA-purple?style=flat-square" alt="Accessibility" />
  <img src="https://img.shields.io/badge/i18n-FR-flag?style=flat-square" alt="i18n" />
  <img src="https://img.shields.io/badge/tests-Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/React_Compiler-enabled-blueviolet?style=flat-square" alt="React Compiler" />
</p>

---

## 📑 Table des matières

- [✨ Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [🧰 Stack technique](#-stack-technique)
- [📂 Structure du projet](#-structure-du-projet)
- [🚀 Démarrage rapide](#-démarrage-rapide)
- [📜 Scripts disponibles](#-scripts-disponibles)
- [🗺️ Routes de l'application](#️-routes-de-lapplication)
- [🧩 Composants UI](#-composants-ui)
- [🔌 Couche API](#-couche-api)
- [🎨 Branding dynamique](#-branding-dynamique)
- [🧪 Tests](#-tests)
- [📝 Changelog](#-changelog)
- [🤝 Contribuer](#-contribuer)

---

## ✨ Fonctionnalités

| Module | Description | Statut |
|---|---|---|
| 🏠 **Homepage** | Carousel héro, catégories fraîches, best sellers, daily deals, promotions, marques tendances, newsletter, badges de confiance | ✅ Done |
| 🔍 **Recherche** | Recherche full-text avec suggestions, filtres avancés (prix, catégorie, marque), tri, pagination | ✅ Done |
| 📦 **Produits** | Fiche produit détaillée, galerie images, avis clients, variantes, produits similaires | ✅ Done |
| 🗂️ **Catégories** | Navigation par catégorie, breadcrumb, filtres dynamiques | ✅ Done |
| 🛒 **Panier** | Ajout/suppression, résumé commande, codes promo, dropdown panier header | ✅ Done |
| 💳 **Checkout** | Tunnel de commande multi-étapes (stepper) | ✅ Done |
| 🔐 **Authentification** | Login OTP (email/téléphone), inscription, mot de passe oublié, social sign-in | ✅ Done |
| 👤 **Compte client** | Profil, adresses, commandes, coupons, paiements, notifications, parrainage, réglages | ✅ Done |
| 📍 **Suivi commande** | Tracking en temps réel avec carte, timeline, estimation de livraison | ✅ Done |
| 🏪 **Boutiques** | Page boutique vendeur détaillée, suivi vendeur (follow), listing des boutiques, "Devenir vendeur" CTA | ✅ Done |
| 📝 **Blog** | Articles, catégories, tags | ✅ Done |
| 💬 **Support Chat** | Chat en direct avec le support | ✅ Done |
| 📄 **Pages CMS** | Pages statiques dynamiques | ✅ Done |
| ❓ **Centre d'aide** | FAQ avec accordéon interactif | ✅ Done |
| 🏷️ **Bannières promo** | Bannières promotionnelles configurables | ✅ Done |
| 🧾 **Factures** | Consultation de factures via token sécurisé | ✅ Done |
| 🎨 **Branding dynamique** | Couleurs, logos, typographie chargés depuis l'API marketplace-config | ✅ Done |
| 🔔 **Toasts** | Système de notifications toast centralisé (Zustand) | ✅ Done |

---

## 🏗️ Architecture

Le projet suit une architecture **feature-first** avec séparation stricte des responsabilités :

```
┌─────────────────────────────────────────────────────────────┐
│                     Pages (SSR par défaut)                   │
│              Server Components + App Router                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐             │
│   │ Queries  │→ │ Services │→ │ Repositories │             │
│   └──────────┘  └──────────┘  └──────────────┘             │
│        ▲                            │                       │
│        │                            ▼                       │
│   ┌──────────┐              ┌──────────────┐               │
│   │  Models  │              │  API Client  │               │
│   │  (Zod)   │              │  (centralisé)│               │
│   └──────────┘              └──────┬───────┘               │
│                                     │                       │
│                                     ▼                       │
│                            ┌──────────────┐                │
│                            │ api.mysugu.com│                │
│                            └──────────────┘                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Branding Provider (SSR) → CSS Custom Properties dynamiques │
├─────────────────────────────────────────────────────────────┤
│       UI Kit (CVA + cn()) — 24 composants réutilisables     │
│  Button · Card · Badge · Modal · Input · Stepper · Tabs · … │
├─────────────────────────────────────────────────────────────┤
│       Edge Middleware — SEO Redirect Proxy + Branding       │
└─────────────────────────────────────────────────────────────┘
```

> **SSR par défaut** : les composants sont Server Components sauf si une interaction client est requise (`"use client"`).

> **React Compiler** : activé pour optimiser automatiquement les re-renders.

---

## 🧰 Stack technique

| Catégorie | Technologie | Version |
|---|---|---|
| ⚡ Framework | [Next.js](https://nextjs.org) (App Router) | `16.1.6` |
| ⚛️ UI Library | [React](https://react.dev) + React Compiler | `19.2.3` |
| 🟦 Langage | [TypeScript](https://typescriptlang.org) (strict) | `5.x` |
| 🎨 Styles | [Tailwind CSS](https://tailwindcss.com) v4 | `4.x` |
| 🧱 Variants | [CVA](https://cva.style) + [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | — |
| 🗄️ State Server | [TanStack Query](https://tanstack.com/query) | `5.x` |
| 🐻 State Client | [Zustand](https://zustand.docs.pmnd.rs) | `5.x` |
| ✅ Validation | [Zod](https://zod.dev) | `4.x` |
| 🎞️ Animations | [Framer Motion](https://www.framer.com/motion/) | `12.x` |
| 🖼️ Carousel | [Swiper](https://swiperjs.com) | `12.x` |
| 🔣 Icônes | [Lucide React](https://lucide.dev) | `0.575+` |
| 🧪 Tests | [Vitest](https://vitest.dev) + [MSW](https://mswjs.io) | `4.x` / `2.x` |

---

## 📂 Structure du projet

```
sugu-marketplace/
├── docs/                              # Documentation
│   ├── ARCHITECTURE_FRONTEND.md       # Architecture détaillée
│   ├── GUIDE_ADD_ENDPOINT.md          # Guide ajout endpoint API
│   └── IMPLEMENTATION_RULES.md        # Règles d'implémentation
│
├── public/                            # Assets statiques
│   ├── banners/                       # Bannières hero, promotions
│   ├── brands/                        # Logos marques
│   ├── categories/                    # Thumbnails catégories
│   ├── icons/                         # Icônes custom
│   ├── products/                      # Photos produits
│   ├── promos/                        # Images promotionnelles
│   └── logo.png                       # Logo Sugu
│
├── src/
│   ├── app/                           # Routes Next.js (App Router)
│   │   ├── (auth)/                    # Routes authentification
│   │   │   ├── login/                 # Connexion (OTP)
│   │   │   ├── register/             # Inscription
│   │   │   ├── onboarding/           # Onboarding
│   │   │   └── forgot-password/      # Mot de passe oublié
│   │   ├── (main)/                    # Routes principales (Header + Footer)
│   │   │   ├── page.tsx              # Homepage
│   │   │   ├── search/              # Recherche avancée
│   │   │   ├── category/[slug]/     # Catégories
│   │   │   ├── product/[slug]/      # Fiche produit
│   │   │   ├── cart/                # Panier
│   │   │   ├── checkout/           # Tunnel de commande
│   │   │   ├── store/[slug]/       # Page boutique vendeur
│   │   │   ├── stores/             # Listing des boutiques
│   │   │   ├── account/            # Espace client
│   │   │   │   ├── addresses/      # Adresses
│   │   │   │   ├── orders/         # Historique commandes
│   │   │   │   ├── coupons/        # Coupons
│   │   │   │   ├── payments/       # Moyens de paiement
│   │   │   │   ├── notifications/  # Notifications
│   │   │   │   ├── referral/       # Parrainage
│   │   │   │   └── settings/       # Réglages
│   │   │   ├── banners/            # Bannières promo
│   │   │   ├── blog/               # Blog
│   │   │   ├── help/               # Centre d'aide
│   │   │   ├── track-order/        # Suivi commande
│   │   │   ├── support-chat/       # Chat support
│   │   │   └── pages/[slug]/       # Pages CMS
│   │   ├── invoices/[token]/       # Factures (token sécurisé)
│   │   ├── globals.css             # Styles globaux + design tokens
│   │   ├── layout.tsx              # Root Layout (branding, fonts, SEO)
│   │   └── not-found.tsx           # Page 404 personnalisée
│   │
│   ├── components/                    # Composants partagés
│   │   ├── ui/                       # UI Kit (24 composants)
│   │   ├── Header.tsx                # En-tête legacy
│   │   ├── Footer.tsx                # Pied de page
│   │   ├── AnnouncementBar.tsx       # Barre d'annonces
│   │   ├── BrandingHead.tsx          # Injection CSS branding
│   │   ├── BrandingProvider.tsx      # Context branding
│   │   ├── CategoryBar.tsx           # Barre catégories
│   │   ├── HeroBanners.tsx           # Carousel héro
│   │   ├── DailyBestSales.tsx        # Section meilleures ventes
│   │   ├── FreshCategories.tsx       # Catégories tendances
│   │   ├── PromotionalDeals.tsx      # Offres promotionnelles
│   │   ├── OrderNowBanner.tsx        # Bannière commande
│   │   ├── ShopByBrands.tsx          # Section marques
│   │   ├── TrendingStores.tsx        # Boutiques tendances
│   │   ├── NewsletterAndTrust.tsx    # Newsletter + badges confiance
│   │   └── BestSeller.tsx            # Section best sellers
│   │
│   ├── features/                      # Domaines métier (feature-first)
│   │   ├── home/                     # Homepage (queries, API, mocks)
│   │   ├── product/                  # Produits
│   │   ├── category/                 # Catégories
│   │   ├── cart/                     # Panier (Zustand store)
│   │   ├── checkout/                 # Commande
│   │   ├── auth/                     # Authentification
│   │   ├── account/                  # Compte client
│   │   ├── search/                   # Recherche
│   │   ├── order/                    # Suivi commandes (mappers, tracking)
│   │   ├── store/                    # Boutiques (API, mappers, queries)
│   │   ├── header/                   # Header (mega menu, search, cart/wishlist dropdown)
│   │   ├── faq/                      # FAQ
│   │   ├── support-chat/             # Chat support
│   │   └── toast/                    # Système de notifications toast
│   │
│   ├── lib/                           # Utilitaires partagés
│   │   ├── api/                      # Couche API centralisée
│   │   │   ├── client.ts            # Wrapper fetch (GET/POST/PUT/PATCH/DELETE)
│   │   │   ├── config.ts            # API_BASE_URL + sécurité (anti-localhost)
│   │   │   ├── endpoints.ts         # URL builders (v1Url, publicUrl, meUrl)
│   │   │   ├── errors.ts            # Classe ApiError normalisée
│   │   │   ├── cache.ts             # Tags de cache ISR + invalidation
│   │   │   ├── auth.ts              # Sanctum CSRF + gestion session
│   │   │   ├── schemas/             # Schemas Zod partagés (pagination, media)
│   │   │   └── __tests__/           # Tests unitaires API
│   │   ├── seo/                      # SEO (structured data JSON-LD)
│   │   ├── branding.service.ts       # Service branding dynamique (fetch + cache)
│   │   ├── branding.types.ts         # Types branding (MarketplaceConfig)
│   │   ├── constants.ts              # Constantes (SITE_NAME, CDN, CURRENCY, formatPrice)
│   │   ├── metadata.ts              # Factory SEO (createMetadata)
│   │   ├── fonts.ts                  # Configuration next/font (Inter)
│   │   └── utils.ts                  # cn() — clsx + tailwind-merge
│   │
│   └── proxy.ts                       # Edge Middleware (SEO redirects)
│
├── package.json
├── tsconfig.json
├── next.config.ts                     # Config Next.js (React Compiler, images)
├── vitest.config.ts                   # Configuration tests Vitest
├── eslint.config.mjs                  # ESLint (anti-localhost guard)
└── postcss.config.mjs
```

---

## 🚀 Démarrage rapide

### Prérequis

| Outil | Version minimum |
|---|---|
| Node.js | `18.x` ou supérieur |
| npm | `9.x` ou supérieur |

### Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/your-org/sugu-marketplace.git
cd sugu-marketplace

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec :
#   NEXT_PUBLIC_API_BASE_URL=https://api.mysugu.com
#   NEXT_PUBLIC_APP_URL=https://sugu.pro

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur. 🎉

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL de l'API backend Laravel | `https://api.mysugu.com` |
| `NEXT_PUBLIC_APP_URL` | URL du site frontend | `https://sugu.pro` |
| `NEXT_PUBLIC_SITE_URL` | URL canonique du site | `https://sugu.pro` |

> ⚠️ **Sécurité** : l'application refuse tout `API_BASE_URL` pointant vers `localhost`, `127.0.0.1` ou toute adresse locale. Cette règle est appliquée à la fois dans `lib/api/config.ts` et via ESLint.

---

## 📜 Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Lance le serveur de développement Next.js |
| `npm run build` | Build de production optimisé |
| `npm run start` | Démarre le serveur de production |
| `npm run lint` | Analyse statique du code (ESLint) |
| `npm run typecheck` | Vérification TypeScript sans émission |
| `npm run test` | Lance les tests unitaires (Vitest) |
| `npm run test:watch` | Lance les tests en mode watch |
| `npm run test:ci` | Lance les tests en mode CI (verbose) |

---

## 🗺️ Routes de l'application

### Routes publiques — Layout `(main)`

| Route | Page | SSR |
|---|---|---|
| `/` | Homepage | ✅ |
| `/search` | Recherche avancée | ✅ |
| `/banners` | Promotions | ✅ |
| `/category/[slug]` | Catégorie | ✅ |
| `/product/[slug]` | Fiche produit | ✅ |
| `/store/[slug]` | Page boutique vendeur | ✅ |
| `/stores` | Listing des boutiques | ✅ |
| `/blog` | Articles | ✅ |
| `/help` | Centre d'aide (FAQ) | ✅ |
| `/pages/[slug]` | Page CMS dynamique | ✅ |

### Routes client — Layout `(main)`

| Route | Page | SSR |
|---|---|---|
| `/cart` | Panier | ✅ |
| `/checkout` | Tunnel de commande | ✅ |
| `/track-order` | Suivi commande (carte + timeline) | ✅ |
| `/support-chat` | Chat support en direct | ✅ |
| `/account` | Espace client — Profil | ✅ |
| `/account/addresses` | Gestion des adresses | ✅ |
| `/account/orders` | Historique des commandes | ✅ |
| `/account/coupons` | Coupons et réductions | ✅ |
| `/account/payments` | Moyens de paiement | ✅ |
| `/account/notifications` | Centre de notifications | ✅ |
| `/account/referral` | Programme de parrainage | ✅ |
| `/account/settings` | Réglages du compte | ✅ |

### Routes authentification — Layout `(auth)`

| Route | Page | SSR |
|---|---|---|
| `/login` | Connexion (OTP) | ❌ |
| `/register` | Inscription | ❌ |
| `/onboarding` | Onboarding | ❌ |
| `/forgot-password` | Mot de passe oublié | ❌ |

### Routes hors layout

| Route | Page | SSR |
|---|---|---|
| `/invoices/[token]` | Consultation facture via token sécurisé | ✅ |

---

## 🧩 Composants UI

Le design system est basé sur **CVA** (Class Variance Authority) pour des composants typés et composables :

```tsx
import { Button, Input, Badge, Card, Skeleton } from "@/components/ui";

// Variantes typées
<Button variant="primary" size="lg">Commander</Button>
<Badge variant="success" size="sm">En stock</Badge>
<Card hoverable>...</Card>
```

### Catalogue complet — `src/components/ui/`

| Composant | Variantes | Client ? |
|---|---|---|
| `Button` | primary, secondary, outline, ghost, accent, danger, link × xs…xl + icon | Non* |
| `Input` | sm, md, lg × default, filled, error | Non* |
| `Textarea` | — | Oui |
| `Badge` | primary, secondary, success, warning, danger, muted × xs…lg | Non |
| `Card` | hoverable | Non |
| `Skeleton` | circle | Non |
| `Modal` | sm, md, lg, xl, full | Oui |
| `Dropdown` | align: left, right | Oui |
| `Tabs` | — | Oui |
| `SectionHeader` | — | Non |
| `Container` | narrow | Non |
| `Breadcrumb` | — | Non |
| `Pagination` | — | Oui |
| `ProductCard` | — | Oui |
| `QuantitySelector` | — | Oui |
| `StarRating` | — | Non |
| `OTPInput` | — | Oui |
| `Stepper` | — | Non |
| `CountdownTimer` | — | Oui |
| `ToggleSwitch` | — | Oui |
| `ScrollArrows` | — | Oui |
| `ViewAllButton` | — | Non |
| `AssuranceBadge` | — | Non |

> *\* Client uniquement si `onClick`/`onChange` est utilisé.*

---

## 🔌 Couche API

Le frontend communique avec le backend Laravel via une couche API centralisée dans `src/lib/api/` :

```
src/lib/api/
├── client.ts       ← Wrapper fetch central (GET/POST/PUT/PATCH/DELETE)
├── config.ts       ← API_BASE_URL + sécurité anti-localhost
├── endpoints.ts    ← URL builders (buildApiUrl, v1Url, publicUrl, meUrl)
├── errors.ts       ← Classe ApiError normalisée
├── cache.ts        ← Tags de cache ISR + invalidation
├── auth.ts         ← Sanctum CSRF + gestion session
├── schemas/        ← Zod schemas partagés (pagination, media)
└── index.ts        ← Barrel export
```

### Règles API

- ✅ **Toujours** utiliser `api.get/post/put/delete` depuis `@/lib/api`
- ✅ **Toujours** construire les URLs via `v1Url()`, `publicUrl()`, ou `meUrl()`
- ✅ **Ajouter** un schema Zod pour validation runtime
- ✅ **Définir** `revalidate` et `tags` pour les endpoints publics (cache ISR)
- ❌ **Jamais** de `fetch()` direct dans un composant ou page
- ❌ **Jamais** d'URL `localhost` (bloqué par config + ESLint)

> 📖 Voir [`docs/GUIDE_ADD_ENDPOINT.md`](docs/GUIDE_ADD_ENDPOINT.md) pour le guide complet d'ajout d'un endpoint.

---

## 🎨 Branding dynamique

Le branding (couleurs, logos, typographie, liens sociaux) est **chargé dynamiquement** depuis l'API `/v1/public/marketplace-config` :

1. **Côté serveur** : `fetchBranding()` dans le Root Layout avec ISR (revalidation 5 min)
2. **Context React** : `<BrandingProvider>` distribue les données à toute l'app
3. **CSS Custom Properties** : `<BrandingHead>` injecte les variables CSS dans `<html>`
4. **Fallback** : si l'API est indisponible, des valeurs par défaut SUGU sont utilisées (jamais de crash)

```tsx
// Accès au branding dans n'importe quel composant client
import { useBranding } from "@/components/BrandingProvider";
const { colors, logos, site } = useBranding();
```

---

## 🧪 Tests

Le projet utilise **Vitest** comme test runner et **MSW** (Mock Service Worker) pour mocker les appels API :

```bash
# Lancer les tests
npm run test

# Mode watch
npm run test:watch

# Mode CI (verbose)
npm run test:ci
```

**Configuration** : `vitest.config.ts` — alias `@/` → `src/`, environment `node`.

---

## 📝 Changelog

Toutes les modifications notables sont documentées ici. Ce projet suit le [Semantic Versioning](https://semver.org/lang/fr/).

### `[0.2.0]` — 2026-03-02

#### 🏪 Boutiques & Vendeurs
- ✅ **Page boutique** (`/store/[slug]`) — Profil vendeur, produits, avis, follow/unfollow
- ✅ **Listing boutiques** (`/stores`) — Recherche et découverte des vendeurs
- ✅ **Composants boutique** — `StoreHeroBanner`, `StoreAboutSection`, `StoreCard`, `FeaturedStoreCard`, `FollowButton`, `BecomeSellerCTA`
- ✅ **Boutiques tendances** — Sections homepage `TrendingStores` et `TrendingStoresSecond`

#### 🔐 Authentification étendue
- ✅ **Inscription** (`/register`) — Formulaire d'inscription complet
- ✅ **Mot de passe oublié** (`/forgot-password`) — Flux de récupération

#### 👤 Compte client enrichi
- ✅ **Commandes** (`/account/orders`) — Historique des commandes
- ✅ **Coupons** (`/account/coupons`) — Gestion des coupons de réduction
- ✅ **Paiements** (`/account/payments`) — Moyens de paiement
- ✅ **Notifications** (`/account/notifications`) — Centre de notifications
- ✅ **Parrainage** (`/account/referral`) — Programme de parrainage
- ✅ **Réglages** (`/account/settings`) — Préférences du compte

#### 📍 Suivi commande avancé
- ✅ **Carte de tracking** — `TrackingMap` avec position en temps réel
- ✅ **Timeline** — `TrackingTimeline` avec événements chronologiques
- ✅ **Estimation livraison** — `EstimatedDeliveryCard`
- ✅ **Mappers** — Transformation données API → modèle frontend

#### 🎨 Branding & Thème dynamique
- ✅ **Branding API** — Couleurs, logos, typographie chargés depuis l'API
- ✅ **BrandingProvider** — Context React pour distribution des données
- ✅ **BrandingHead** — Injection CSS custom properties
- ✅ **Fallback** — Valeurs par défaut en cas d'indisponibilité API

#### 🔌 Couche API centralisée
- ✅ **Client API** — Wrapper fetch avec retry, timeout, error handling
- ✅ **URL Builders** — `v1Url()`, `publicUrl()`, `meUrl()` pour construction sécurisée
- ✅ **Cache ISR** — Tags de cache avec invalidation
- ✅ **Auth Sanctum** — Gestion CSRF et session
- ✅ **Guard anti-localhost** — Protection config + ESLint

#### 🧩 Nouveaux composants UI
- ✅ `Breadcrumb`, `Pagination`, `ProductCard`, `QuantitySelector`
- ✅ `StarRating`, `OTPInput`, `Stepper`, `CountdownTimer`
- ✅ `ToggleSwitch`, `ScrollArrows`, `ViewAllButton`, `AssuranceBadge`

#### 🔍 Header refactorisé
- ✅ **MarketplaceHeader** — Server Component avec données ISR (catégories, recherche populaire)
- ✅ **Mega menu catégories** — Navigation avec sous-catégories
- ✅ **Recherche avec suggestions** — `SearchBar` + `SearchDropdown`
- ✅ **Dropdowns** — `CartDropdown` et `WishlistDropdown` dans le header

#### 🧪 Infrastructure de tests
- ✅ **Vitest** — Test runner configuré
- ✅ **MSW** — Mock API pour les tests
- ✅ **Tests API** — Tests unitaires de la couche API

#### 📦 Autres ajouts
- ✅ **React Compiler** — Activé pour optimisation automatique des re-renders
- ✅ **Factures** (`/invoices/[token]`) — Consultation via token sécurisé
- ✅ **Edge Middleware** — Proxy SEO redirect avec timeout 2s et sécurité
- ✅ **Structured Data** — JSON-LD pour SEO avancé
- ✅ **Toast system** — Notifications centralisées via Zustand
- ✅ **Page 404** — Page personnalisée avec mascotte
- ✅ **AnnouncementBar** — Barre d'annonces configurable
- ✅ **Newsletter** — Formulaire d'abonnement + badges de confiance

### `[0.1.0]` — 2026-02-22

#### 🎉 Première version (MVP)

##### Ajouté
- ✅ **Homepage** — Carousel héro, catégories fraîches, best sellers, promotions, marques tendances
- ✅ **Recherche** — Recherche full-text avec filtres (prix, catégorie, marque), tri et pagination
- ✅ **Fiche produit** — Galerie images, variantes, avis clients, produits similaires
- ✅ **Catégories** — Navigation par catégorie avec breadcrumb et filtres
- ✅ **Panier** — Gestion du panier, résumé commande, codes promo
- ✅ **Checkout** — Tunnel de commande multi-étapes
- ✅ **Authentification** — Login OTP (email/téléphone), inscription, sign-in social
- ✅ **Compte client** — Profil, adresses, historique commandes, favoris
- ✅ **Suivi commande** — Tracking en temps réel
- ✅ **Blog** — Pages articles, catégories et tags
- ✅ **Chat support** — Chat en direct avec l'équipe support
- ✅ **Pages CMS** — Pages statiques dynamiques
- ✅ **Centre d'aide** — FAQ et base de connaissances
- ✅ **Bannières promo** — Bannières promotionnelles configurables
- ✅ **SEO** — Metadata factory, redirections automatiques, middleware SEO
- ✅ **Design System** — UI Kit (Button, Card, Badge, Modal, Input, Skeleton…)
- ✅ **Architecture** — Feature-first, SSR par défaut, Zod validation, TanStack Query

---

## 🤝 Contribuer

### Conventions de code

| Cible | Convention | Exemple |
|---|---|---|
| Fichiers/dossiers | `kebab-case` | `product-card.tsx` |
| Composants React | `PascalCase` | `ProductCard` |
| Fonctions/variables | `camelCase` | `getProductById` |
| Types/Interfaces | `PascalCase` | `ProductDetail` |
| Constantes | `SCREAMING_SNAKE` | `API_BASE_URL` |
| Fonctions query | `camelCase query*` | `queryFeaturedProducts()` |
| CSS variables | `kebab-case` | `--color-primary` |

### Workflow Git

```bash
# 1. Créer une branche
git checkout -b feature/nom-de-la-feature

# 2. Commiter (conventional commits)
git commit -m "feat(product): add product gallery zoom"
git commit -m "fix(cart): fix quantity update on mobile"
git commit -m "docs(readme): update changelog"

# 3. Push et Pull Request
git push origin feature/nom-de-la-feature
```

### Types de commits

| Préfixe | Description |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `docs` | Documentation |
| `style` | Formatage (pas de changement de code) |
| `refactor` | Refactoring |
| `perf` | Amélioration de performance |
| `test` | Ajout/modification de tests |
| `chore` | Maintenance, dépendances |

### Documentation interne

| Document | Description |
|---|---|
| [`docs/ARCHITECTURE_FRONTEND.md`](docs/ARCHITECTURE_FRONTEND.md) | Architecture détaillée, tokens, conventions |
| [`docs/IMPLEMENTATION_RULES.md`](docs/IMPLEMENTATION_RULES.md) | 10 règles non négociables |
| [`docs/GUIDE_ADD_ENDPOINT.md`](docs/GUIDE_ADD_ENDPOINT.md) | Guide pas-à-pas pour consommer un endpoint |

---

## 📄 Licence

Ce projet est **propriétaire**. Tous droits réservés © 2026 SUGU.

---

<p align="center">
  Fait avec ❤️ par l'équipe <strong>SUGU</strong>
</p>
