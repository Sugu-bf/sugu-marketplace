<p align="center">
  <img src="public/logo.svg" alt="SUGU Marketplace" width="200" />
</p>

<h1 align="center">🛒 SUGU Marketplace</h1>

<p align="center">
  <strong>La marketplace africaine nouvelle génération — rapide, moderne et accessible.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue?style=for-the-badge&logo=semver&logoColor=white" alt="Version" />
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
- [📝 Changelog](#-changelog)
- [🤝 Contribuer](#-contribuer)

---

## ✨ Fonctionnalités

| Module | Description | Statut |
|---|---|---|
| 🏠 **Homepage** | Carousel héro, catégories, best sellers, promotions, marques | ✅ Done |
| 🔍 **Recherche** | Recherche full-text, filtres, tri, pagination | ✅ Done |
| 📦 **Produits** | Fiche produit détaillée, galerie, avis, variantes | ✅ Done |
| 🗂️ **Catégories** | Navigation par catégorie, breadcrumb, filtres | ✅ Done |
| 🛒 **Panier** | Ajout/suppression, résumé commande, codes promo | ✅ Done |
| 💳 **Checkout** | Tunnel de commande multi-étapes | ✅ Done |
| 🔐 **Authentification** | Login OTP, inscription, social sign-in | ✅ Done |
| 👤 **Compte client** | Profil, adresses, commandes, favoris | ✅ Done |
| 📍 **Suivi commande** | Tracking en temps réel | ✅ Done |
| 📝 **Blog** | Articles, catégories, tags | ✅ Done |
| 💬 **Support Chat** | Chat en direct avec le support | ✅ Done |
| 📄 **Pages CMS** | Pages statiques dynamiques | ✅ Done |
| ❓ **Centre d'aide** | FAQ, aide en ligne | ✅ Done |
| 🏷️ **Bannières promo** | Gestion des bannières promotionnelles | ✅ Done |

---

## 🏗️ Architecture

Le projet suit une architecture **feature-first** avec séparation stricte des responsabilités :

```
┌─────────────────────────────────────────────────┐
│                   Pages (SSR)                   │
│         Server Components par défaut            │
├─────────────────────────────────────────────────┤
│                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│   │ Queries  │→ │ Services │→ │ Repositories │ │
│   └──────────┘  └──────────┘  └──────────────┘ │
│        ▲                            │           │
│        │                            ▼           │
│   ┌──────────┐              ┌──────────────┐   │
│   │  Models  │              │   API / Mock  │   │
│   │  (Zod)   │              │              │   │
│   └──────────┘              └──────────────┘   │
│                                                 │
├─────────────────────────────────────────────────┤
│              UI Kit (CVA + cn())                │
│       Button · Card · Badge · Modal · …         │
└─────────────────────────────────────────────────┘
```

> **SSR par défaut** : les composants sont Server Components sauf si une interaction client est requise (`"use client"`).

---

## 🧰 Stack technique

| Catégorie | Technologie | Version |
|---|---|---|
| ⚡ Framework | [Next.js](https://nextjs.org) (App Router) | `16.1.6` |
| ⚛️ UI Library | [React](https://react.dev) | `19.2.3` |
| 🟦 Langage | [TypeScript](https://typescriptlang.org) (strict) | `5.x` |
| 🎨 Styles | [Tailwind CSS](https://tailwindcss.com) | `4.x` |
| 🧱 Variants | [CVA](https://cva.style) + [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | — |
| 🗄️ State Server | [TanStack Query](https://tanstack.com/query) | `5.x` |
| 🐻 State Client | [Zustand](https://zustand.docs.pmnd.rs) | `5.x` |
| ✅ Validation | [Zod](https://zod.dev) | `4.x` |
| 🎞️ Animations | [Framer Motion](https://www.framer.com/motion/) | `12.x` |
| 🖼️ Carousel | [Swiper](https://swiperjs.com) | `12.x` |
| 🔣 Icônes | [Lucide React](https://lucide.dev) | `0.575+` |

---

## 📂 Structure du projet

```
sugu-marketplace/
├── docs/                          # Documentation
│   ├── ARCHITECTURE_FRONTEND.md   # Architecture détaillée
│   └── IMPLEMENTATION_RULES.md    # Règles d'implémentation
│
├── public/                        # Assets statiques
│
├── src/
│   ├── app/                       # Routes Next.js (App Router)
│   │   ├── (auth)/                # Routes authentification
│   │   ├── (main)/                # Routes principales
│   │   │   ├── page.tsx           # Homepage
│   │   │   ├── search/            # Recherche
│   │   │   ├── category/[slug]/   # Catégories
│   │   │   ├── product/[slug]/    # Fiche produit
│   │   │   ├── cart/              # Panier
│   │   │   ├── checkout/          # Tunnel de commande
│   │   │   ├── account/           # Espace client
│   │   │   ├── blog/              # Blog
│   │   │   ├── help/              # Centre d'aide
│   │   │   ├── track-order/       # Suivi commande
│   │   │   └── support-chat/      # Chat support
│   │   ├── globals.css            # Styles globaux + tokens
│   │   └── layout.tsx             # Layout racine
│   │
│   ├── components/                # Composants partagés
│   │   ├── ui/                    # UI Kit (Button, Card, Badge…)
│   │   ├── Header.tsx             # En-tête global
│   │   ├── Footer.tsx             # Pied de page
│   │   └── ...                    # Composants métier globaux
│   │
│   ├── features/                  # Domaines métier (feature-first)
│   │   ├── product/               # Produits
│   │   ├── cart/                   # Panier
│   │   ├── checkout/              # Commande
│   │   ├── auth/                  # Authentification
│   │   ├── account/               # Compte
│   │   ├── search/                # Recherche
│   │   ├── category/              # Catégories
│   │   ├── order/                 # Commandes
│   │   ├── home/                  # Homepage
│   │   └── support-chat/          # Chat support
│   │
│   ├── lib/                       # Utilitaires partagés
│   │   ├── constants.ts           # Constantes (SITE_NAME, CDN, …)
│   │   ├── metadata.ts            # Factory SEO
│   │   └── fonts.ts               # Configuration next/font
│   │
│   └── middleware.ts              # Middleware Next.js (SEO redirects)
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
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

# 4. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur. 🎉

---

## 📜 Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Lance le serveur de développement Next.js |
| `npm run build` | Build de production optimisé |
| `npm run start` | Démarre le serveur de production |
| `npm run lint` | Analyse statique du code (ESLint) |

---

## 🗺️ Routes de l'application

| Route | Page | Layout | SSR |
|---|---|---|---|
| `/` | Homepage | `(main)` | ✅ |
| `/login` | Connexion | `(auth)` | ❌ |
| `/onboarding` | Inscription | `(auth)` | ❌ |
| `/search` | Recherche | `(main)` | ✅ |
| `/banners` | Promotions | `(main)` | ✅ |
| `/category/[slug]` | Catégorie | `(main)` | ✅ |
| `/product/[slug]` | Fiche produit | `(main)` | ✅ |
| `/cart` | Panier | `(main)` | ✅ |
| `/checkout` | Tunnel commande | `(main)` | ✅ |
| `/track-order` | Suivi commande | `(main)` | ✅ |
| `/account` | Espace client | `(main)` | ✅ |
| `/account/addresses` | Adresses | `(main)` | ✅ |
| `/blog` | Articles | `(main)` | ✅ |
| `/help` | Centre d'aide | `(main)` | ✅ |
| `/support-chat` | Chat support | `(main)` | ✅ |
| `/pages/[slug]` | Page CMS | `(main)` | ✅ |

---

## 🧩 Composants UI

Le design system est basé sur **CVA** (Class Variance Authority) pour des composants typés et composables :

```tsx
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Variantes typées
<Button variant="primary" size="lg">Commander</Button>
<Badge variant="success" size="sm">En stock</Badge>
<Card hoverable>...</Card>
```

| Composant | Variantes | Client ? |
|---|---|---|
| `Button` | primary, secondary, outline, ghost × sm, md, lg | Oui |
| `Card` | hoverable | Non |
| `Badge` | primary, secondary, success, warning, danger × xs…lg | Non |
| `Input` | sm, md, lg × default, filled, error | Non* |
| `Modal` | sm, md, lg, xl, full | Oui |
| `Skeleton` | circle | Non |

---

## 📝 Changelog

Toutes les modifications notables sont documentées ici. Ce projet suit le [Semantic Versioning](https://semver.org/lang/fr/).

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
- ✅ **Middleware** — Redirections SEO et URL slug tracking
- ✅ **Design System** — UI Kit complet (Button, Card, Badge, Modal, Input, Skeleton…)
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

---

## 📄 Licence

Ce projet est **propriétaire**. Tous droits réservés © 2026 SUGU.

---

<p align="center">
  Fait avec ❤️ par l'équipe <strong>SUGU</strong>
</p>
