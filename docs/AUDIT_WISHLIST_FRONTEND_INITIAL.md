# Audit Wishlist — Frontend Next.js (sugu-marketplace)

> **Statut :** Discovery read-only — constat factuel uniquement.
> **Date :** 2026-06-04
> **Repo audité :** `C:\xampp\htdocs\sugu-marketplace` (frontend buyer-facing, sert `sugu.pro`)
> **Branche :** `main` (working tree clean au moment de l'audit)
> **Backend de référence :** `C:\xampp\htdocs\sugu` — Sprint Wishlist V2 clôturé 2026-06-04.

---

## 1. Résumé exécutif

Le frontend possède une implémentation **wishlist partielle et legacy**, branchée exclusivement sur les **anciennes routes dépréciées** `/api/v1/wishlist/*`. Trois points de contact existent : (a) le bouton cœur sur la **page détail produit** (`ProductImageGallery`), (b) un **dropdown wishlist** dans le header (`WishlistDropdown`), (c) un lien mort « Liste de souhaits » dans le footer.

L'architecture cible (Set local d'IDs + overlay sur toutes les cartes + bootstrap `GET /favorites/ids` + bulk-merge invité) **n'existe pas du tout** : pas de store dédié, pas de Set en mémoire, pas de persistance localStorage, pas d'overlay sur les cartes produit (grilles home/catégorie/recherche/boutique **sans aucun cœur**), pas de page wishlist dédiée, pas de flux merge invité.

L'état favori est **local au composant** (`useState` dans `ProductImageGallery`), jamais bootstrappé : au rechargement, un produit déjà favorisé apparaît avec un cœur vide. Chaque interaction tape directement le backend legacy. Le dropdown header refetch à chaque ouverture. Aucune des nouvelles routes `/api/v1/mobile/favorites/*` n'est connue du frontend, et les headers de dépréciation `Deprecation`/`Sunset` ne sont **ni interceptés ni loggés**.

L'auth repose sur une architecture **BFF** (cookie HttpOnly `auth_token` + proxy `/api/backend/[...path]`). Les favoris invités ne sont pas gérés en local : l'app dispose d'un `guestEntry()` backend mais le dropdown wishlist n'est pas gardé par l'auth (un invité déclenche un fetch qui 401 → état vide silencieux).

**En l'état : tout le travail de migration reste à faire ; l'existant est minimal, partiellement mort, et non aligné sur la cible.**

---

## 2. Stack & architecture

| Aspect | Valeur |
|---|---|
| Framework | Next.js **16.1.6**, **App Router** (`src/app/`), React Server Components |
| React | 19.2.3 + React Compiler activé (`reactCompiler: true`, `babel-plugin-react-compiler`) |
| Langage | TypeScript ^5, **`strict: true`**, alias `@/* → ./src/*` |
| Output | `standalone` (Docker), ISR + Cloudflare edge caching (`next.config.ts`) |
| State management | **Zustand ^5** (cart, header), **TanStack Query ^5.90** (présent en deps), pas de Redux/Jotai/SWR |
| Validation | **Zod ^4.3.6** (validation runtime sur les réponses API) |
| Styling | **Tailwind CSS v4** (`@tailwindcss/postcss`), `clsx` + `tailwind-merge` (`cn()`), `class-variance-authority` |
| Icônes | `lucide-react` (`Heart`) |
| Animations | `framer-motion`, `swiper` |
| Realtime | `laravel-echo` + `pusher-js` (Reverb) |
| Auth | **BFF** : cookie HttpOnly `auth_token` (Sanctum), proxy same-origin `/api/backend/[...path]` injecte `Authorization: Bearer` côté serveur |
| Pattern API | Client central unique `src/lib/api/client.ts` (`api.get/post/put/patch/delete`), URLs via `v1Url()`/`buildApiUrl()`, jamais de `fetch()` brut en UI |
| Base URL API | `NEXT_PUBLIC_API_BASE_URL` (prod `https://api-zk47m.mysugu.com`, local `https://api.mysugu.com`) — **jamais localhost** (guard `config.ts`) |
| Tests | **Vitest ^4** + jsdom + **MSW ^2.12** (mocks réseau) + `@vitejs/plugin-react` |
| i18n | **Aucun** (pas de `next-intl`/`i18n`) — chaînes FR en dur |
| PWA / SW | **Aucun** (pas de manifest, pas de service worker) |

**Convention de feature :** code organisé par domaine sous `src/features/<feature>/` avec sous-dossiers `api/`, `components/`, `models/`, `queries/`, `services/`, `store/`, `__tests__/`. Il n'existe **pas** de `src/features/wishlist/` — le code wishlist est dispersé dans `product/` et `header/`.

---

## 3. Inventaire des fichiers wishlist

| Fichier | Rôle | Statut |
|---|---|---|
| [src/features/product/api/product-detail.api.ts](src/features/product/api/product-detail.api.ts) | `fetchWishlist()`, `addToWishlist()`, `removeFromWishlist()` — appels legacy | **Actif** |
| [src/features/product/api/product-detail.schemas.ts](src/features/product/api/product-detail.schemas.ts) | `WishlistItemSchema`, `WishlistResponseSchema`, types `AddToWishlistPayload` | Actif |
| [src/features/product/components/ProductImageGallery.tsx](src/features/product/components/ProductImageGallery.tsx) | Bouton cœur sur page détail produit (toggle optimiste local) | **Actif** |
| [src/features/product/api/index.ts](src/features/product/api/index.ts) / [src/features/product/index.ts](src/features/product/index.ts) | Ré-exports des fonctions/types wishlist | Actif |
| [src/features/header/api/header.api.ts](src/features/header/api/header.api.ts) | `fetchWishlistPreview()`, `fetchWishlistCount()` — appels legacy | **Actif** |
| [src/features/header/api/header.schemas.ts](src/features/header/api/header.schemas.ts) | `WishlistPreviewItemSchema`, `WishlistPreviewResponseSchema`, `WishlistCountResponseSchema` | Actif |
| [src/features/header/components/WishlistDropdown.tsx](src/features/header/components/WishlistDropdown.tsx) | Dropdown header (preview au survol, lazy fetch) | **Actif** |
| [src/features/header/components/HeaderSkeletons.tsx](src/features/header/components/HeaderSkeletons.tsx) | `WishlistDropdownSkeleton` | Actif |
| [src/features/header/components/MarketplaceHeaderClient.tsx](src/features/header/components/MarketplaceHeaderClient.tsx) | Monte `<WishlistDropdown />` (non gardé par auth) | Actif |
| [src/features/header/index.ts](src/features/header/index.ts) | Ré-exports header wishlist | Actif |
| [src/lib/api/cache.ts](src/lib/api/cache.ts) | `CacheTags.wishlist()` | Actif (tag défini) |
| [src/app/api/backend/[...path]/route.ts](src/app/api/backend/[...path]/route.ts) | Proxy BFF — forwarde `x-wishlist-token` (req + resp) | Actif |
| [src/components/Footer.tsx](src/components/Footer.tsx) | Lien « Liste de souhaits » → `/account/wishlist` | **Lien mort** (route inexistante) |
| [src/components/Header.tsx](src/components/Header.tsx) | Ancien header avec icône `Heart` | **Code mort** (non importé nulle part) |
| [src/features/product/__tests__/product-detail.schemas.test.ts](src/features/product/__tests__/product-detail.schemas.test.ts) | Test schéma `WishlistResponseSchema` | Test actif |
| [src/features/header/__tests__/header.api.test.ts](src/features/header/__tests__/header.api.test.ts) | Test schéma `WishlistPreviewItemSchema` | Test actif |

**Absences notables :** pas de `src/features/wishlist/`, pas de store Zustand wishlist, pas de hook `useWishlist`/`useFavorites`, pas de page `/wishlist`/`/favoris`/`/account/wishlist`, pas de cœur dans `src/components/ui/product-card.tsx`.

---

## 4. Endpoints actuellement consommés

Tous les appels passent par le client central et — côté navigateur — sont reroutés vers le **BFF** `/api/backend/api/v1/...` (cf. `shouldProxyThroughBff` dans `client.ts`).

| Méthode | Path (logique) | Fichier:ligne | Retour attendu | Gestion erreur | Auth |
|---|---|---|---|---|---|
| `GET` | `/api/v1/wishlist` | [product-detail.api.ts:167](src/features/product/api/product-detail.api.ts#L167) | `WishlistResponse` (`{success,data:{items[]}}`) | `try/catch` → `return null` (silencieux) | BFF (cookie→Bearer) |
| `POST` | `/api/v1/wishlist/items` | [product-detail.api.ts:187](src/features/product/api/product-detail.api.ts#L187) | `WishlistResponse` | pas de catch local — remonte à l'appelant | `initCsrf()` + BFF, `retries:0` |
| `DELETE` | `/api/v1/wishlist/items/{itemId}` | [product-detail.api.ts:200](src/features/product/api/product-detail.api.ts#L200) | `WishlistResponse` | remonte à l'appelant | `initCsrf()` + BFF, `retries:0` |
| `GET` | `/api/v1/wishlist` (preview) | [header.api.ts:142](src/features/header/api/header.api.ts#L142) | `WishlistPreviewData` | `try/catch` → `console.error` + `null` | BFF |
| `GET` | `/api/v1/wishlist/count` | [header.api.ts:162](src/features/header/api/header.api.ts#L162) | `number` | `try/catch` → `return 0` | BFF |

**Observations :**
- L'ajout/suppression utilise le sous-chemin **`wishlist/items` / `wishlist/items/{id}`**, qui doit être réconcilié avec les paths réels des routes legacy backend (le spec backend liste les routes dépréciées comme *index / count / store / destroy / clear* sous `/api/v1/wishlist/*` sans confirmer le segment `/items`). **À vérifier** : si le backend legacy n'expose pas `/items`, ces appels échouent déjà ou tapent un autre handler.
- La granularité de suppression côté frontend est **par `itemId` de wishlist** (id de ligne), pas par `productId` — divergent du modèle cible (DELETE par `productId`).
- Aucun endpoint clear-all (`DELETE /wishlist`) n'est consommé.
- Aucun appel aux nouvelles routes `/api/v1/mobile/favorites/*`.

---

## 5. State management wishlist

| Aspect | Constat |
|---|---|
| Store dédié | **Aucun.** Pas de store Zustand, pas de contexte React, pas de query TanStack pour la wishlist. |
| Forme du state | **Local au composant uniquement.** `ProductImageGallery` tient `isWishlisted: boolean`, `wishlistItemId: string\|number\|null` via `useState`. Le header tient `data: WishlistPreviewData \| null` local au `WishlistDropdown`. |
| Set d'IDs en mémoire | **Inexistant.** Aucune structure `Set<string>` d'IDs favorisés partagée. |
| Hydration / bootstrap | **Aucune.** `ProductImageGallery` démarre toujours `isWishlisted=false` ; `fetchWishlist` est **importé mais jamais appelé** ([ProductImageGallery.tsx:7](src/features/product/components/ProductImageGallery.tsx#L7)). Le dropdown fetch en lazy au premier survol. |
| Persistance localStorage | **Aucune** pour les favoris. (localStorage utilisé seulement pour `auth_token_expires_at` et le cart token.) |
| Update optimiste | **Oui, mais local-composant.** `ProductImageGallery` flip `setIsWishlisted` immédiatement, mutex `useRef` anti-double-clic, revert sur erreur. Le revert ne déclenche **aucun toast** (juste `console.warn` si 401). |
| Cohérence inter-composants | **Nulle.** Toggle sur la page produit ne met pas à jour le dropdown header (et inversement). États indépendants. |

---

## 6. UI Components — affichage cœurs

| Composant | Emplacement | Lecture de l'état favori | Pattern toggle | Loading / error |
|---|---|---|---|---|
| [ProductImageGallery.tsx](src/features/product/components/ProductImageGallery.tsx) | Page détail produit (image principale, coin haut-droit) | `useState` local `isWishlisted` (jamais bootstrappé → toujours `false` au mount) | `handleWishlistToggle` : flip optimiste → `addToWishlist`/`removeFromWishlist` → revert sur échec | `isToggling` → spinner `Loader2`, bouton `disabled` ; 401 → `console.warn`, pas de modal login |
| [WishlistDropdown.tsx](src/features/header/components/WishlistDropdown.tsx) | Header (icône `Heart` + popover desktop) | `fetchWishlistPreview()` lazy au survol, state local `data` | **Aucun toggle** — affichage seul (liste preview 5 items + CTA « Voir tout » → `/account`) | `loading` → `WishlistDropdownSkeleton` ; erreur → `catch` silencieux → état vide |
| [Header.tsx](src/components/Header.tsx) (legacy) | — | Icône `Heart` statique | — | **Code mort** (composant non monté) |

**Cartes produit (grilles) :** [src/components/ui/product-card.tsx](src/components/ui/product-card.tsx) — **aucun cœur**, aucune notion de favori. Les grilles home / catégorie / recherche / boutique n'affichent donc **aucun overlay favori**. C'est l'écart le plus large vs la cible (« overlay partout »).

**Compteur / badge :** `fetchWishlistCount()` existe mais le `WishlistDropdown` affiche un count dérivé du fetch preview (`data.count`), pas un badge persistant sur l'icône. Le trigger `aria-label` mentionne le count mais l'icône n'a pas de pastille visuelle dédiée alimentée par un état global.

---

## 7. Page wishlist dédiée

**Inexistante.**
- Aucune route `/wishlist`, `/favoris`, `/mes-favoris`, ni `/account/wishlist` (vérifié : `src/app/(main)/account/` ne contient que `addresses`, `coupons`, `notifications`, `orders`, `payments`, `referral`, `settings`).
- Le footer pointe vers `/account/wishlist` → **404** ([Footer.tsx:43](src/components/Footer.tsx#L43)).
- Le CTA « Voir tout » du dropdown pointe vers `/account` (pas une page wishlist).
- La page `/account` ([src/app/(main)/account/page.tsx](src/app/(main)/account/page.tsx)) ne référence ni `wishlist` ni `favori`.

---

## 8. Auth flow & guest handling

| Aspect | Constat |
|---|---|
| Architecture | **BFF.** Cookie HttpOnly `auth_token` (Sanctum, max-age 90j) posé par le proxy `/api/backend/[...path]` ([route.ts](src/app/api/backend/[...path]/route.ts)). Le token n'entre jamais dans le JS navigateur. |
| Détection auth (client) | `hasAuthSession()` lit le cookie non-sensible `auth_token_expires_at` / localStorage ([auth-service.ts:99](src/features/auth/services/auth-service.ts#L99)). Le header appelle ensuite `getAuthUser()` (`/me`) si une session est probable ([MarketplaceHeaderClient.tsx:93](src/features/header/components/MarketplaceHeaderClient.tsx#L93)), re-checké sur `window focus`. |
| Wishlist gardée par auth ? | **Non.** `<WishlistDropdown />` est monté inconditionnellement ([MarketplaceHeaderClient.tsx:387](src/features/header/components/MarketplaceHeaderClient.tsx#L387)). Pour un invité, le survol déclenche `fetchWishlistPreview()` → 401 → `catch` → état vide silencieux. Le bouton cœur produit appelle l'API ; 401 → `console.warn` + revert. |
| Comportement invité | **Pas de favoris local-only.** Aucune persistance locale ; tout transite par le backend. L'app dispose d'un `guestEntry()` (`POST /api/v1/web-auth/guest`, émet un token de session invité) mais il **n'est pas câblé à la wishlist**. |
| Flux merge guest → user | **Inexistant.** Aucun `bulk-merge`, aucune orchestration au login. |

---

## 9. Tests existants

| Framework | Détail |
|---|---|
| Runner | **Vitest ^4** (`vitest run`), jsdom, MSW pour les mocks réseau |

Tests touchant la wishlist (**schémas uniquement, aucun test comportemental**) :
- [product-detail.schemas.test.ts:328](src/features/product/__tests__/product-detail.schemas.test.ts#L328) — `WishlistResponseSchema` valide une réponse correcte (1 cas).
- [header.api.test.ts:88](src/features/header/__tests__/header.api.test.ts#L88) — `WishlistPreviewItemSchema` valide un item (1 cas).

**Couverture estimée :** quasi nulle côté comportement. Aucun test sur `addToWishlist`/`removeFromWishlist`, le toggle optimiste, le revert, le dropdown, ou la gestion 401/invité. Aucun test E2E (pas de Playwright/Cypress en deps).

---

## 10. Cohabitation backend

| Aspect | Constat |
|---|---|
| Connaissance des nouvelles routes | **Non.** Aucune mention de `/api/v1/mobile/favorites/*` dans le codebase. |
| Routes consommées | Exclusivement legacy : `GET /wishlist`, `GET /wishlist/count`, `POST /wishlist/items`, `DELETE /wishlist/items/{id}`. |
| Headers `Deprecation`/`Sunset` | **Ni interceptés ni loggés.** `copyResponseHeaders()` du BFF ne propage qu'une allow-list (`content-type`, `x-request-id`, `x-cart-token`, `x-wishlist-token`) — `Deprecation`, `Sunset`, `Link` sont **filtrés/perdus** avant d'atteindre le client. Aucun `console.warn`, aucune télémétrie. |
| Échéance | Routes legacy supprimées au **Sunset 2026-09-01** (backlog backend `SUGU-WISHLIST-LEGACY-ROUTES-REMOVAL` P1) → l'implémentation actuelle **cessera de fonctionner** à cette date si non migrée. |
| Token wishlist invité | Le BFF forwarde déjà `x-wishlist-token` (req + resp) — vestige d'un modèle « wishlist invité par token » non exploité côté UI actuelle. |

---

## 11. Cas spéciaux

| Cas | Constat |
|---|---|
| Multi-onglets / multi-tabs | **Aucune cohérence.** Pas de `Set` partagé, pas de `BroadcastChannel`, pas de sync `storage` event. Chaque onglet a ses états locaux ; le header re-check l'auth sur `focus` mais pas la wishlist. |
| SSR vs CSR (cœurs) | Le bouton cœur est dans un composant `"use client"` démarrant `isWishlisted=false` → pas de risque d'hydration mismatch, mais **état toujours faux au premier rendu** (un favori existant s'affiche vide jusqu'à action). Le dropdown est CSR lazy. |
| i18n | **Aucun système i18n.** Tous les libellés wishlist sont du **français en dur** (`"Retirer des favoris"`, `"Liste de souhaits"`, `"Votre liste de souhaits est vide"`…). |
| PWA / Service Worker / offline | **Absent.** Pas de manifest, pas de SW. Aucun support offline pour les favoris. |
| Realtime | `laravel-echo`/Reverb présents mais **non utilisés** pour la wishlist. |
| React Compiler | Activé — attention aux mutations de refs/state lors d'un futur refactor (mémoïsation automatique). |

---

## 12. Gaps vs spécification cible

| Aspect | Actuel | Cible | Écart |
|---|---|---|---|
| Set local d'IDs | Inexistant | `Set<string>` en mémoire partagé | **Total** — à créer |
| Bootstrap | `fetchWishlist` importé mais jamais appelé ; état toujours `false` | `GET /favorites/ids` au login + focus/foreground, ETag/304 | **Total** |
| Overlay cartes | Cœur seulement sur page détail produit | Cœur sur **toutes** les cartes (home, catégorie, recherche, détail), 0 appel/card | **Large** — `product-card.tsx` sans cœur |
| Endpoints | Legacy `/wishlist/*` (dépréciés, Sunset 09-01) | `/api/v1/mobile/favorites/*` | **Total** |
| Granularité suppression | Par `itemId` (ligne wishlist) | Par `productId` | Divergent |
| Update optimiste | Oui mais local-composant, pas de toast | Flip local + POST/DELETE arrière-plan + revert + toast | Partiel |
| Persistance invité | Aucune (tout backend, 401 silencieux) | localStorage local-only + `bulk-merge` au login | **Total** |
| Merge guest→user | Inexistant | `POST /favorites/bulk-merge` orchestré au login | **Total** |
| Store global | Aucun | Store partagé (Zustand probable) source de vérité | **Total** |
| Cohérence multi-tabs | Aucune | Set cohérent entre onglets | **Total** |
| Page wishlist dédiée | Inexistante (footer 404) | À définir (cible Flutter ne l'impose pas, mais lien footer la suppose) | À décider |
| Headers dépréciation | Filtrés par le BFF, jamais vus | (cible) routes migrées → non applicable | À traiter pendant migration |
| Tests | 2 tests de schéma | Couverture toggle/optimiste/merge/invité | **Large** |
| i18n | FR en dur | (statu quo projet — pas d'i18n) | Aligné sur le reste du repo |

---

## 13. Risques de refactor identifiés

1. **Couche BFF (`/api/backend/[...path]/route.ts`) — sensible.** Toute requête navigateur transite par ce proxy. La migration vers `/api/v1/mobile/favorites/*` doit respecter le contrôle d'origine, l'injection Bearer, et l'allow-list de headers. Les codes 204 (idempotents) et 304 (ETag des nouvelles routes) sont déjà gérés par le proxy (`status !== 204 && status !== 304`), **mais** l'ETag / `If-None-Match` n'est **pas** dans `ALLOWED_RESPONSE_HEADERS` ni `FORWARDED_REQUEST_HEADERS` → le 304 conditionnel ne fonctionnera pas tel quel.
2. **Client API central (`src/lib/api/client.ts`) — fondation partagée.** Utilisé par toutes les features. Un favori avec ETag/`If-None-Match` nécessite d'exposer/forwarder ces headers ; modifier le client impacte tout le repo → changements additifs uniquement.
3. **`product-card.tsx` — composant de grille hautement réutilisé.** Ajouter un overlay cœur touche home/catégorie/recherche/boutique simultanément. Risque de régression visuelle/perf (ISR, React Compiler).
4. **États locaux dispersés.** `ProductImageGallery` et `WishlistDropdown` portent des états indépendants ; introduire un store global doit les unifier sans casser l'optimistic existant (mutex `useRef`).
5. **Routes legacy en sursis.** L'implémentation actuelle casse au Sunset 2026-09-01. Toute solution intermédiaire bâtie sur `/wishlist/*` est jetable.
6. **`fetchWishlist` / `fetchWishlistCount` morts ou semi-morts.** `fetchWishlist` importé non utilisé ; `fetchWishlistCount` défini mais non câblé à un badge → nettoyage à prévoir, attention aux ré-exports (`index.ts`).
7. **Lien footer 404 (`/account/wishlist`)** et CTA dropdown `/account` → toute page wishlist cible doit réconcilier ces liens.
8. **React Compiler activé** — la mémoïsation auto peut masquer des bugs de state partagé mal conçu ; tester explicitement la réactivité du futur store.

---

## 14. Questions ouvertes pour décision

1. **Technologie du store global favoris** : Zustand (cohérent avec cart/header) vs TanStack Query (déjà en deps, gère cache/ETag/invalidation) vs hybride (Zustand pour le Set + Query pour le bootstrap) ?
2. **Persistance invité** : localStorage brut, store Zustand persisté (`persist` middleware), ou cookie ? Quel quota / éviction (cap 200 backend) appliquer côté client ?
3. **Overlay sur les cartes** : étendre `product-card.tsx` (impact large) ou wrapper dédié ? Comment éviter tout appel API par card (lecture `Set.has` uniquement) sans casser l'ISR/SSR des grilles ?
4. **Page wishlist dédiée** : faut-il en créer une (le footer la suppose) ? Route cible (`/account/wishlist` vs `/favoris`) ? SSR ou CSR pur ?
5. **Granularité** : confirmer le passage de la suppression par `itemId` (legacy) à la suppression par `productId` (cible) — impact sur le modèle local.
6. **Timing du merge invité** : déclencher `bulk-merge` à quel moment exact (post-login success, post-OTP, post-Google) ? Gestion du `truncated`/`skipped_count` côté UX ?
7. **Bootstrap & ETag/304** : faut-il faire passer le `If-None-Match`/`ETag` à travers le BFF (modif allow-list) ou stocker l'`updated_at` côté client comme cache-buster ?
8. **Bootstrap focus/foreground** : réutiliser le pattern `window focus` déjà présent dans le header, ou un hook dédié ?
9. **Toasts** : brancher le revert d'échec sur la feature `toast` existante (`src/features/toast`) ? Messages FR ?
10. **Nettoyage legacy** : supprimer immédiatement le code mort (`Header.tsx`, `fetchWishlist` non utilisé, lien footer) ou le geler jusqu'à la migration complète ?
11. **Cohérence multi-onglets** : `BroadcastChannel` / `storage` event requis dès le MVP, ou phase ultérieure ?

---

*Fin du constat. Aucune proposition de plan/sprint dans ce document — voir discussion de validation.*
