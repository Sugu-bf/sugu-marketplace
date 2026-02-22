# Règles d'Or — SUGU Frontend

> **10 règles non négociables.** À relire avant chaque commit.

---

### 1. SSR d'abord
Tout composant est **Server Component** par défaut. `"use client"` uniquement pour les interactions (hooks, events, browser APIs).

### 2. Données = queries, jamais dans l'UI
Aucun composant UI n'importe un mock ou n'appelle une API. Les pages appellent `query*()` depuis `features/*/queries/`.

### 3. Design tokens, pas de valeurs en dur
Utiliser `bg-primary`, `text-primary-dark`, `border-border` — jamais `bg-[#F15412]` ni `text-[#171717]`.

### 4. `cn()` pour toutes les classes conditionnelles
```tsx
import { cn } from "@/lib/utils";
className={cn("base", condition && "active", className)}
```

### 5. Un `<h1>` par page, HTML sémantique
`<main>`, `<section>`, `<nav>`, `<footer>`, `<article>`. Hierarchy : h1 > h2 > h3.

### 6. `next/image` partout
Jamais de `<img>`. Toujours `alt`, `sizes`, et `priority` seulement pour le LCP.

### 7. SEO via `createMetadata()`
Chaque page exporte `metadata` via la factory. Pas de metadata ad hoc.

### 8. Vérifier avant de créer
Avant tout nouveau composant : vérifier `components/ui/`, puis `components/`, puis `features/*/components/`.

### 9. Types stricts
TypeScript strict. Zod pour les données runtime. Pas de `any`, pas de `as` sauf très justifié.

### 10. `loading.tsx` pour chaque route
Skeleton qui reflète la structure réelle de la page. Utiliser `<Skeleton />` du UI Kit.

---

*Lire aussi : `docs/ARCHITECTURE_FRONTEND.md` pour le guide complet.*
