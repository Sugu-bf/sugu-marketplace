# Sprint Frontend — Wishlist V2 — Plan de découpage en lots

> **Statut :** PLAN seulement — aucune implémentation. En attente de validation.
> **Date :** 2026-06-04
> **Repo cible :** `C:\xampp\htdocs\sugu-marketplace`
> **Backend de référence :** `C:\xampp\htdocs\sugu` (Sprint Wishlist V2 clôturé 2026-06-04, `d5c8cb6` → `898a4bc`)
> **Audit source :** `docs/AUDIT_WISHLIST_FRONTEND_INITIAL.md` (validé)
> **Décisions cadre :** 14 décisions validées (non renégociables) — voir mission.

---

## Inventaire pré-vol (résultats factuels)

### A. Repo
- Working dir confirmé : `c:/xampp/htdocs/sugu-marketplace`.
- `git status` : working tree clean (seul `docs/AUDIT_WISHLIST_FRONTEND_INITIAL.md` untracked).
- Branche : `main`, à jour avec `origin/main`. Derniers commits : COD / orders-ui / auth (sprint COD précédent).

### B. Outillage
| Aspect | Constat |
|---|---|
| Package manager | **npm** (`package-lock.json` présent ; pas de pnpm/yarn lock). |
| Linter | **ESLint 9 flat config** (`eslint.config.mjs`), preset `eslint-config-next` (core-web-vitals + typescript) + guard `no-restricted-syntax` anti-localhost. Commande : `npm run lint` (= `eslint`). |
| Formatter | **Aucun Prettier/Biome** au niveau projet (le seul `.prettierrc` est dans `node_modules/pusher-js`). Le formatage est porté par ESLint uniquement. |
| Typecheck | `npm run typecheck` (= `tsc --noEmit`), TS strict. |
| Test runner | **Vitest 4** (`vitest.config.ts`). `environment: "node"` **global** ; `include: src/**/*.test.{ts,tsx}`. Commandes : `npm test` (= `vitest run`), `npm run test:watch`, `npm run test:ci`. |
| MSW | `msw ^2.12.10` présent en devDep **mais AUCUN harness `setupServer` câblé** — pas de `setupFiles`, pas de `tests/__mocks__/`. |
| jsdom | `jsdom ^28` présent. Pas d'env global jsdom : les rares tests DOM utilisent le docblock `// @vitest-environment jsdom` par fichier (ex. `recentSearches.test.ts`). |
| **Testing Library** | **ABSENT.** Aucun `@testing-library/react`, `@testing-library/jest-dom`, ni `@testing-library/user-event` dans `package.json`. → **Blocker P0** (voir Section 12, Q2). |
| CI/CD | **Aucun** `.github/workflows/`, pas de GitLab CI. Les gates sont **100 % locaux** (lint + typecheck + vitest). |

### C. Frozen layers — confirmation
- `src/features/auth/` : services dans `auth-service.ts` (`loginUser`, `verifyOtp`, `googleSignIn`, `registerUser`, `guestEntry`…). **Découverte clé :** le succès auth est traité dans les composants (`LoginPageClient`, `RegisterPageClient`, `GoogleSignInButton`) par **`window.location.href = ...` (redirection dure / full reload)**, PAS de `router.push` SPA. → impacte directement Q7 (voir Section 7 + Section 12, Q1). `GoogleSignInButton` expose un prop `onSuccess?` mais redirige dur juste après.
- `src/features/cart/` : store Zustand **sans `persist`** (`cart-store.ts`, state en mémoire + events `cart-events.ts`). Pas de merge-on-login existant à mirrorer. Le pattern `persist` devra être introduit (déjà dispo dans `zustand/middleware`).
- `src/features/toast/` : `useToast` (Zustand). API : `toast.success/error/info/warning(message, { action?, duration? })`. Messages FR en dur. ✅ utilisable tel quel.
- `src/lib/api/client.ts` : `api.get/post/put/patch/delete`, retourne `{ data, status, headers, requestId }` — **`headers` exposés** (lecture ETag possible sans modif). ⚠️ `executeRequest` traite tout `!response.ok` comme `ApiError` → **un 304 lève une erreur** (voir Section 5 + Q3). En env test (`NODE_ENV==="test"`), `shouldProxyThroughBff` renvoie `false` → les tests mockent les **URLs absolues `API_BASE_URL`**, pas `/api/backend/...`.
- `src/app/api/backend/[...path]/route.ts` : BFF. `ALLOWED_RESPONSE_HEADERS = [content-type, x-request-id, x-cart-token, x-wishlist-token]` ; `FORWARDED_REQUEST_HEADERS = [accept, accept-language, content-type, user-agent, x-request-id, x-cart-token, x-wishlist-token, x-idempotency-key]`. 304 déjà non-bufferisé (`status !== 204 && status !== 304`). ⚠️ `copyResponseHeaders` force `cache-control: no-store` (voir Q3).
- `src/components/ui/product-card.tsx` : `"use client"`, props `{ product: ProductListItem, showSaleBadge?, className? }`. JSX = `<Link>` > image (quick-add button overlay bottom-right) + infos. **Aucun cœur.** Point d'insertion `<FavoriteHeart>` : coin haut-droit de la div image (symétrique du quick-add).
- `next.config.ts` / React Compiler : non touché.
- TanStack Query : `QueryProvider` (`src/lib/query-provider.tsx`) avec défaut **`refetchOnWindowFocus: false`** → le bootstrap favoris devra override **par query** (voir Q4).
- Endpoints : `buildApiUrl(path, params)` + helpers `v1Url`/`publicUrl`/`meUrl`. Pas de helper `/mobile/*` → à ajouter (additif) dans la feature wishlist.
- Routes account : `src/app/(main)/account/` avec `layout.tsx` partagé ; sous-routes existantes (addresses, coupons, notifications, orders, payments, referral, settings). **Pas de `wishlist/`.** Footer ligne 43 pointe `/account/wishlist` → 404 aujourd'hui.

### D. Validation implicite — blockers détectés (STOP-AND-ASK)
1. **Testing Library absent** alors que les décisions 4/13/14 imposent RTL (overlay card, réactivité). → nécessite l'**unique `npm install` du sprint** (Lot 1). Q2.
2. **Auth = redirection dure** (`window.location.href`) → le merge ne peut PAS s'exécuter « dans le success event puis continuer la session SPA » (la page recharge). Réconciliation **au montage post-reload** requise. Q1.
3. **304 vs client central** : `!response.ok` lève sur 304 + BFF `cache-control: no-store`. La modif « 2 lignes » (Q9) est **nécessaire mais pas suffisante** pour un 304 end-to-end. Q3.

Ces 3 points sont tranchés en Section 12 et **bloquent le démarrage du Lot 1**.

---

## Section 1 — Synopsis

Migration complète du système favoris legacy (`/api/v1/wishlist/*`, état local-composant, Sunset backend 2026-09-01) vers l'architecture cible : Set d'IDs Zustand (source de vérité d'affichage, `has()` O(1)) + bootstrap TanStack `GET /favorites/ids` (ETag/304) + persistance invité localStorage + merge au login + overlay cœur sur toutes les cartes + page `/account/wishlist` dédiée. **7 lots**, strictement séquentiels par dépendance de données, chacun revertable par `git revert`. Phase **ajout** (Lots 1-4, construction parallèle sans toucher au legacy ; les cartes gagnent un cœur — pure addition zéro-downtime), phase **switch** (Lots 5-6, page dédiée puis bascule `ProductImageGallery`/`WishlistDropdown`), phase **cleanup** (Lot 7 terminal). Le legacy reste 100 % fonctionnel jusqu'au switch du Lot 6. **Risque global : moyen** — concentré sur 3 points (harness de test à créer, BFF partagé, réactivité React Compiler du Set). Ordre d'exécution : 1 → 2 → 3 → 4 → 5 → 6 → 7 (5 peut chevaucher 4 ; 6 requiert 3+4).

## Section 2 — Table des lots

| Lot | Titre | Objectif (1 ligne) | Fichiers touchés | Tests G1 | Risque | Bloque |
|---|---|---|---|---|---|---|
| 1 | Harness tests + BFF ETag | Câbler RTL+MSW ; étendre BFF (etag / if-none-match) | ~5 N / 2 M | ~2 | Moyen (BFF partagé) | 2,3,4,5,6,7 |
| 2 | Store + persist + API client | `src/features/wishlist/` data layer (Set, persist guest v1, api `/mobile/favorites/*`) | ~6 N / 0 M | ~4 | Faible | 3,4,5,6 |
| 3 | Bootstrap + hooks + merge | Query `GET /favorites/ids`, `useIsFavorite`, `useToggleFavorite`, `useMergeFavoritesOnLogin`, provider | ~6 N / 1 M | ~6 | Moyen (réactivité, merge) | 4,5,6 |
| 4 | Overlay `<FavoriteHeart>` | Cœur sur `product-card.tsx` (pure addition) + montage provider | ~2 N / 2 M | ~3 | Moyen (carte hyper-réutilisée) | 6 |
| 5 | Page `/account/wishlist` | Route dédiée SSR shell + CSR (`GET /mobile/wishlist`) ; fix footer 404 | ~3 N / 1 M | ~2 | Faible | — |
| 6 | Switch surfaces legacy | Basculer `ProductImageGallery` + `WishlistDropdown` vers le store | ~0 N / 4 M | ~3 | **Élevé** (surfaces vivantes) | 7 |
| 7 | Cleanup legacy | Suppression code mort `fetchWishlist*`, schemas, ré-exports, `Header.tsx` | ~0 N / ~8 M (suppr.) | ajuste | Moyen (ré-exports) | — |

(N = fichiers nouveaux, M = modifiés ; counts anticipés.)

## Section 3 — Détail par lot

### Lot 1 — Harness tests + extension BFF ETag
- **Objectif** : Établir l'infrastructure de test RTL+MSW (inexistante) et étendre le BFF pour la propagation ETag/`If-None-Match`. Aucun comportement favoris encore — socle de plomberie.
- **Préconditions** : aucune. Premier lot. **Requiert validation Q2 (install RTL) + Q3 (stratégie 304) avant démarrage.**
- **Fichiers nouveaux** :
  - `vitest.setup.ts` — setup global MSW (`beforeAll(server.listen)`, `afterEach(server.resetHandlers)`, `afterAll(server.close)`) + `@testing-library/jest-dom` matchers. Référencé via `setupFiles` dans `vitest.config.ts`.
  - `src/test/msw/server.ts` — `setupServer(...handlers)` (Node).
  - `src/test/msw/handlers.ts` — handlers de base (vide/extensible par lot), mockant les URLs **absolues** `API_BASE_URL` (cf. court-circuit BFF en test).
  - `src/test/render.tsx` — helper `renderWithProviders` (wrappe `QueryClientProvider` test-friendly : `retry:false`).
  - `src/test/README.md` — convention `// @vitest-environment jsdom` pour les tests composant/hook.
- **Fichiers modifiés** (surgical) :
  - `package.json` — devDeps `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` (Q2). **Unique install du sprint.**
  - `vitest.config.ts` — ajout `setupFiles: ["./vitest.setup.ts"]`. (Env reste `node` global ; jsdom par docblock.)
  - `src/app/api/backend/[...path]/route.ts` — **2 lignes** : `"etag"` dans `ALLOWED_RESPONSE_HEADERS`, `"if-none-match"` dans `FORWARDED_REQUEST_HEADERS`. **Aucun autre changement.** (Voir Section 5 pour le sort de `cache-control: no-store`, dépendant de Q3.)
- **Tests G1 (Vitest+RTL+MSW)** :
  - `src/app/api/backend/__tests__/route.etag.test.ts` (env node) :
    - `it forwards if-none-match request header to upstream`
    - `it exposes etag response header to the client`
    - `it returns 304 with empty body without buffering` (selon Q3, assertion adaptée)
  - `src/test/__tests__/harness.smoke.test.tsx` (env jsdom) : `it renders a component through renderWithProviders` (valide RTL+jsdom+jest-dom câblés).
  - Mocks MSW requis : handler upstream `API_BASE_URL/api/v1/mobile/favorites/ids` renvoyant `etag` / `304` selon `if-none-match`.
- **Gates** :
  - G1 : `npx vitest run src/app/api/backend src/test`
  - G2 : 3× isolation (mêmes fichiers) + 1× regression ciblée `npx vitest run src/features/header/__tests__/recentSearches.test.ts` (seul test jsdom existant, sensible au setup global).
  - G3 (non-bloquant) : `npm test` (full) + `npm run lint` + `npm run typecheck`.
- **Lint/Format DoD** : `npm run lint` (zéro warning sur fichiers nouveaux) + `npm run typecheck`.
- **Risques** : (tech) un `setupFiles` global peut perturber les tests `node` existants si MSW intercepte du réseau inattendu → handlers vides + `onUnhandledRequest: "bypass"`. (tech) BFF est partagé par TOUTES les requêtes → la 2-ligne doit rester strictement additive.
- **Décisions à valider AVANT exécution** : Q2 (install RTL), Q3 (304 — `no-store` conservé ou assoupli pour `/favorites/ids` ?).
- **Rollback** : `git revert <sha Lot1>`. Restaure `vitest.config.ts` + `route.ts` + retire les devDeps (re-`npm install`). Aucun consommateur applicatif encore → revert sans effet de bord.

### Lot 2 — Store favoris + persistance invité + client API
- **Objectif** : Construire la couche données pure de `src/features/wishlist/` : Set Zustand source de vérité, persistance invité localStorage versionnée (cap 200 FIFO), fonctions API vers `/api/v1/mobile/favorites/*`. Aucun React/UI.
- **Préconditions** : Lot 1 (harness).
- **Fichiers nouveaux** :
  - `src/features/wishlist/store/favorites-store.ts` — Zustand `Set<string>` + `persist` middleware (clé `sugu_favorites_guest_v1`, `partialize` du Set ↔ array, cap 200 + éviction FIFO). Actions : `add`, `remove`, `toggle`, `has`, `replaceAll(ids)`, `clearGuest`.
  - `src/features/wishlist/api/favorites.api.ts` — `fetchFavoriteIds()` (GET `/mobile/favorites/ids`, lit ETag), `addFavorite(productId)`, `removeFavorite(productId)`, `bulkMergeFavorites(ids)` (POST `/mobile/favorites/bulk-merge`), `fetchWishlistPage()` (GET `/mobile/wishlist`).
  - `src/features/wishlist/api/favorites.schemas.ts` — Zod : `FavoriteIdsResponseSchema`, `BulkMergeResponseSchema` (`{ truncated, skipped_count }`), `WishlistPageResponseSchema`.
  - `src/features/wishlist/models/favorites.ts` — types UI dérivés.
  - `src/features/wishlist/index.ts` — ré-exports (barrel).
  - `src/features/wishlist/api/favorites.endpoints.ts` — helpers URL `/api/v1/mobile/favorites/*` + `/api/v1/mobile/wishlist` (additif, miroir de `endpoints.ts`).
- **Fichiers modifiés** : aucun.
- **Tests G1** :
  - `src/features/wishlist/store/__tests__/favorites-store.test.ts` (jsdom — localStorage) :
    - `it adds and removes ids with O(1) has()`
    - `it toggles membership`
    - `it persists guest set to sugu_favorites_guest_v1`
    - `it caps at 200 and evicts FIFO on overflow`
    - `it rehydrates from versioned key on init`
    - `it clears guest storage on clearGuest()`
  - `src/features/wishlist/api/__tests__/favorites.api.test.ts` (node + MSW) :
    - `it parses favorite ids response`
    - `it parses bulk-merge response with truncated/skipped_count`
    - `it throws on schema mismatch`
  - Mocks MSW : handlers `API_BASE_URL/api/v1/mobile/favorites/ids|bulk-merge` + `/mobile/wishlist`.
- **Gates** : G1 `npx vitest run src/features/wishlist` ; G2 3× isolation + regression `npx vitest run src/features/cart` (pattern store voisin) ; G3 full + lint + typecheck.
- **Lint/Format DoD** : `npm run lint` + `npm run typecheck` (fichiers neufs : zéro tolérance).
- **Risques** : (tech) stabilité de référence du Set sous React Compiler — exposer un Set immuable recréé à chaque mutation (jamais muté en place) sinon re-renders ratés/incontrôlés (couvert Lot 3/4). (tech) `persist` SSR : guard `typeof window` (skipHydration / storage conditionnel).
- **Décisions à valider** : Q7 (deux endpoints : `ids` pour les cœurs, `wishlist` pour la page — confirmer).
- **Rollback** : `git revert <sha Lot2>`. Feature non importée ailleurs → revert propre.

### Lot 3 — Bootstrap query + hooks + orchestration merge
- **Objectif** : Brancher le Set sur le réseau : bootstrap `GET /favorites/ids` (TanStack, ETag/304, `refetchOnWindowFocus`), hooks de lecture/mutation optimiste, et orchestration merge invité→user au login.
- **Préconditions** : Lot 2.
- **Fichiers nouveaux** :
  - `src/features/wishlist/queries/use-favorites-bootstrap.ts` — `useQuery(['favorites','ids'])` → `replaceAll` du Set ; **override `refetchOnWindowFocus: true` par query** (Q4) ; gestion ETag (selon Q3).
  - `src/features/wishlist/hooks/use-is-favorite.ts` — `useIsFavorite(productId)` (selector Zustand `s => s.set.has(id)`, pattern selector recommandé pour réactivité ciblée).
  - `src/features/wishlist/hooks/use-toggle-favorite.ts` — `useMutation` : flip optimiste Zustand → POST/DELETE → `invalidateQueries(['favorites','ids'])` ; revert + `toast.error("Impossible d'ajouter/retirer des favoris")` sur échec ; mutex anti-double-clic.
  - `src/features/wishlist/hooks/use-merge-favorites-on-login.ts` — **réconciliation au montage** (Q1) : si `hasAuthSession()` && Set guest non vide en storage → `bulkMergeFavorites(ids)` → `fetchFavoriteIds()` → `replaceAll` → `clearGuest()`. `truncated:true` → `toast.info("Certains favoris n'ont pas pu être transférés (limite atteinte)")` ; `skipped_count>0` → `console.info` silencieux.
  - `src/features/wishlist/components/WishlistProvider.tsx` — `"use client"` ; appelle bootstrap + merge-on-login au montage (monté en Lot 4).
  - `src/features/wishlist/queries/favorites-keys.ts` — query keys centralisées.
- **Fichiers modifiés** : `src/features/wishlist/index.ts` (ré-exports hooks/provider).
- **Tests G1** :
  - `use-toggle-favorite.test.tsx` (jsdom+MSW) : `it flips set optimistically before network`, `it reverts and toasts on add failure`, `it reverts and toasts on remove failure`, `it invalidates ids query on success`.
  - `use-merge-favorites-on-login.test.tsx` : `it merges guest set then rehydrates and clears storage when authenticated`, `it does nothing when guest set empty`, `it does nothing when unauthenticated`, `it shows info toast when truncated`, `it logs silently when skipped_count > 0`.
  - `use-favorites-bootstrap.test.tsx` : `it populates set from GET ids`, `it sends If-None-Match and handles 304 without clobbering set` (selon Q3).
  - `use-is-favorite.reactivity.test.tsx` : `it re-renders consumer when set mutates` (réactivité Compiler/selector).
  - Mocks MSW : `ids`, `bulk-merge`, add/remove (POST/DELETE), 304 conditionnel. Mock `hasAuthSession`.
- **Gates** : G1 `npx vitest run src/features/wishlist` ; G2 3× isolation + regression `npx vitest run src/features/auth` (merge consomme l'état auth, ne le modifie pas) ; G3 full + lint + typecheck.
- **Lint/Format DoD** : `npm run lint` + `npm run typecheck`.
- **Risques** : (tech) réactivité — selector instable = pas de re-render ou re-render en boucle ; test explicite obligatoire. (tech) merge au montage = double exécution si provider remonte → garde idempotente (flag « merge tenté pour cette session »). (UX) merge silencieux par défaut.
- **Décisions à valider** : Q1 (réconciliation-au-montage), Q3 (304), Q4 (refetchOnWindowFocus par query).
- **Rollback** : `git revert <sha Lot3>`. Provider non monté encore (Lot 4) → aucun impact runtime.

### Lot 4 — Overlay `<FavoriteHeart>` sur product-card + montage provider
- **Objectif** : Ajouter le cœur sur **toutes** les cartes produit (home/catégorie/recherche/boutique) — pure addition (les cartes n'avaient aucun cœur). Monter `<WishlistProvider>` dans l'arbre app.
- **Préconditions** : Lot 3 (hooks).
- **Fichiers nouveaux** :
  - `src/features/wishlist/components/FavoriteHeart.tsx` — `"use client"`, props `{ productId, className? }`. Lit `useIsFavorite(productId)`, toggle via `useToggleFavorite`. `e.preventDefault()/stopPropagation()` (carte = `<Link>`). Icône `lucide-react` `Heart` (rempli/vide).
  - `src/features/wishlist/components/__tests__/...` (tests ci-dessous).
- **Fichiers modifiés** (surgical) :
  - `src/components/ui/product-card.tsx` — insertion `<FavoriteHeart productId={String(product.id)} />` coin haut-droit de la div image. **Aucun autre changement** ; le reste reste SSR/inchangé.
  - `src/app/layout.tsx` (ou provider racine existant) — monter `<WishlistProvider>` une fois, sous `QueryProvider` (Q5).
- **Tests G1** :
  - `FavoriteHeart.test.tsx` (jsdom) : `it renders empty heart when not favorited`, `it renders filled heart when favorited`, `it calls toggle on click without navigating`.
  - `product-card.heart.reactivity.test.tsx` : **`it re-renders ProductCard heart when set mutates`** (décision 14, réactivité Compiler).
  - `product-card.test.tsx` : `it keeps quick-add and link behavior intact` (non-régression carte).
  - Mocks MSW : add/remove favorites.
- **Gates** : G1 `npx vitest run src/components/ui src/features/wishlist/components` ; G2 3× isolation + regression sur tout test consommant `ProductCard` (grilles) ; G3 full + lint + typecheck.
- **Lint/Format DoD** : `npm run lint` (diff `product-card.tsx` surgical) + `npm run typecheck`.
- **Risques** : (tech) `product-card.tsx` utilisé simultanément home/catégorie/recherche/boutique → régression visuelle/perf (ISR, Compiler). (tech) zone cliquable cœur vs `<Link>` parent → `stopPropagation`. (UX) cœur visible pour invité = OK (Set local).
- **Décisions à valider** : Q5 (point de montage provider racine).
- **Rollback** : `git revert <sha Lot4>`. Retire le cœur des cartes + démonte provider → retour état Lot 3 (legacy intact, jamais touché).

### Lot 5 — Page `/account/wishlist` dédiée
- **Objectif** : Créer la page favoris (résout le 404 footer + CTA dropdown). SSR shell + CSR contenu via `GET /api/v1/mobile/wishlist`.
- **Préconditions** : Lot 3 (data/hooks). Indépendant du Lot 4 (peut chevaucher).
- **Fichiers nouveaux** :
  - `src/app/(main)/account/wishlist/page.tsx` — SSR shell (titre, breadcrumb, skeleton), sous `account/layout.tsx`.
  - `src/features/wishlist/components/WishlistPageClient.tsx` — `"use client"`, hydrate la liste (`useQuery(['favorites','page'])` → `fetchWishlistPage`), réutilise `<ProductCard>` (cœurs déjà branchés post-Lot 4), empty state FR (« Votre liste de souhaits est vide »).
  - `src/app/(main)/account/wishlist/loading.tsx` — skeleton route.
- **Fichiers modifiés** :
  - `src/components/Footer.tsx` — lien déjà `/account/wishlist` (ligne 43) → devient résolu (aucun changement de href requis ; vérifier). CTA « Voir tout » du `WishlistDropdown` → repointer `/account` → `/account/wishlist` (peut être fait ici ou Lot 6 ; **assigné Lot 6** avec le switch dropdown pour cohérence du diff).
- **Tests G1** :
  - `WishlistPageClient.test.tsx` (jsdom+MSW) : `it renders empty state when no favorites`, `it renders product cards from /mobile/wishlist`.
  - Mocks MSW : `GET /mobile/wishlist` (vide + peuplé).
- **Gates** : G1 `npx vitest run src/features/wishlist/components src/app/(main)/account/wishlist` ; G2 3× isolation + regression account layout si test existant ; G3 full + lint + typecheck.
- **Lint/Format DoD** : `npm run lint` + `npm run typecheck`.
- **Risques** : (tech) cohérence Set (cœurs) vs liste page (`/mobile/wishlist`) — un retrait depuis la page doit invalider les deux queries. (UX) empty state.
- **Décisions à valider** : Q6 (route `/account/wishlist` confirmée).
- **Rollback** : `git revert <sha Lot5>`. Route disparaît → footer redevient 404 (état antérieur). Aucun impact sur cartes/store.

### Lot 6 — Switch des surfaces legacy vers le store
- **Objectif** : Basculer `ProductImageGallery` (page détail) et `WishlistDropdown` (header) du legacy `/wishlist/*` vers le store/hook unifié. Le code `fetchWishlist*` legacy reste **défini mais non-appelé** (cleanup au Lot 7).
- **Préconditions** : Lot 3 + Lot 4.
- **Fichiers nouveaux** : aucun.
- **Fichiers modifiés** (surgical, refactor contrôlé) :
  - `src/features/product/components/ProductImageGallery.tsx` — remplacer `useState` local + `addToWishlist/removeToWishlist` par `useIsFavorite`/`useToggleFavorite`. Bootstrap correct (le cœur reflète l'état réel au mount). Conserver l'UX spinner/disabled.
  - `src/features/header/components/WishlistDropdown.tsx` — lire le compteur/preview depuis le store (count = `set.size`) + `GET /mobile/wishlist` pour la preview au lieu de `fetchWishlistPreview/Count` legacy. CTA « Voir tout » → `/account/wishlist`.
  - `src/features/header/components/MarketplaceHeaderClient.tsx` — si nécessaire, garde auth du dropdown (cohérence invité). Surgical.
  - (éventuel) `src/features/header/components/HeaderSkeletons.tsx` — inchangé sauf si signature change.
- **Tests G1** :
  - `ProductImageGallery.switch.test.tsx` : `it reflects favorite state from store on mount`, `it toggles through store hook`.
  - `WishlistDropdown.switch.test.tsx` : `it derives count from store set`, `it links to /account/wishlist`.
  - Regression : les tests legacy schémas restent verts (non touchés ici).
- **Gates** : G1 `npx vitest run src/features/product src/features/header` ; G2 3× isolation + **regression ciblée obligatoire** `npx vitest run src/features/product/__tests__/product-detail.schemas.test.ts src/features/header/__tests__/header.api.test.ts` (doivent rester verts — pas encore supprimés) ; G3 full + lint + typecheck.
- **Lint/Format DoD** : `npm run lint` + `npm run typecheck`.
- **Risques** : **(tech, élevé)** surfaces vivantes utilisées en prod → toute régression casse une UX existante. (tech) cohérence header focus vs store. (UX) zéro-downtime : le switch doit être atomique par composant.
- **Décisions à valider** : aucune nouvelle (toutes tranchées en amont).
- **Rollback** : `git revert <sha Lot6>`. Restaure les composants sur le legacy `/wishlist/*` (toujours présent) → wishlist fonctionnelle à l'ancienne. **C'est la garantie zéro-downtime du sprint.**

### Lot 7 — Cleanup legacy (terminal)
- **Objectif** : Supprimer le code favoris legacy mort post-switch. Discipline bank-grade : aucun mélange feature+cleanup.
- **Préconditions** : Lot 6 (switch effectif, legacy non-appelé).
- **Fichiers nouveaux** : aucun.
- **Fichiers modifiés/supprimés** (voir Section 8 pour la liste exhaustive) :
  - `product-detail.api.ts` (`fetchWishlist/addToWishlist/removeFromWishlist`), `product-detail.schemas.ts` (schemas wishlist), `header.api.ts` (`fetchWishlistPreview/Count`), `header.schemas.ts`, ré-exports `product/index.ts` + `header/index.ts`, `Header.tsx` (code mort), tests obsolètes (partiels).
- **Tests G1** : ajuster/retirer `product-detail.schemas.test.ts` (bloc wishlist) + `header.api.test.ts` (bloc wishlist) ; le reste de ces fichiers préservé. `it` retirés = ceux ciblant les schemas supprimés.
- **Gates** : G1 `npx vitest run src/features/product src/features/header` ; G2 3× isolation + regression full feature wishlist ; G3 `npm test` full (doit être 100 % vert, zéro import cassé) + lint + typecheck.
- **Lint/Format DoD** : `npm run lint` (détecte imports/ré-exports orphelins) + `npm run typecheck` (détecte références mortes).
- **Risques** : (tech) ré-exports `index.ts` consommés ailleurs → `typecheck` est le filet. (tech) suppression partielle de fichiers de test → ne pas casser les `describe` voisins non-wishlist.
- **Décisions à valider** : Q8 (confirmer suppression `Header.tsx` mort dans ce lot).
- **Rollback** : `git revert <sha Lot7>`. Restaure le code legacy (inerte) → aucun impact fonctionnel (déjà non-appelé depuis Lot 6).

## Section 4 — Stratégie de migration progressive

- **Phase ajout (Lots 1-4)** : `src/features/wishlist/` construit en parallèle. Le legacy (`ProductImageGallery` toggle local, `WishlistDropdown`, `fetchWishlist*`) reste **intact et fonctionnel**. Le Lot 4 ajoute le cœur sur les cartes — pure addition (les cartes n'en avaient aucun), donc aucun risque de régression de l'existant. À la fin du Lot 4 : nouveau système actif sur les cartes + page (Lot 5), ancien système toujours actif sur détail produit + dropdown. Cohabitation = deux sources d'état favoris coexistent temporairement (acceptable : surfaces disjointes).
- **Phase switch (Lots 5-6)** : Lot 5 ajoute la page (résout 404). Lot 6 bascule `ProductImageGallery` + `WishlistDropdown` vers le store. À ce point le `fetchWishlist*` legacy est défini mais **non-appelé**.
- **Phase cleanup (Lot 7)** : suppression du code mort.
- **Garantie zéro-downtime** : à chaque lot, le `git revert` du lot restaure exactement l'état fonctionnel précédent. Le legacy `/wishlist/*` n'est retiré qu'au Lot 7, **après** validation du switch en prod (Lot 6) — donc un revert du Lot 6 ramène instantanément la wishlist legacy fonctionnelle. À aucun instant un user ne voit une wishlist cassée : soit le nouveau système, soit l'ancien, jamais un vide.

## Section 5 — Stratégie BFF ETag extension (Q9)

- **Modif `route.ts` — 2 lignes exactes** :
  - `ALLOWED_RESPONSE_HEADERS` : ajouter `"etag"`.
  - `FORWARDED_REQUEST_HEADERS` : ajouter `"if-none-match"`.
- **Comportement TanStack attendu** : bootstrap envoie `If-None-Match: <etag stocké>` → 200 (nouveau corps + nouvel ETag, `replaceAll`) ou 304 (corps vide → conserver le Set, ne pas clobber).
- **⚠️ Subtilité critique (pré-vol)** : la « 2-ligne » est **nécessaire mais pas suffisante** :
  1. `copyResponseHeaders` force `cache-control: no-store` → pas de revalidation HTTP native navigateur.
  2. Le client central (`client.ts`) traite `!response.ok` comme `ApiError` → **un 304 lève une erreur** avant d'atteindre TanStack.
  → Le bootstrap `/favorites/ids` doit donc gérer le 304 explicitement. **Deux options (Q3)** : (A) le fetcher du bootstrap lit l'ETag et gère le 304 **hors** du chemin `!response.ok` (fetch dédié dans `favorites.api.ts`, sans passer par le throw du client central) ; (B) assouplir `cache-control` pour le seul path `/favorites/ids` dans le BFF (dépasse la « 2-ligne »). **Recommandé : A** (préserve le BFF strictement à 2 lignes ; le 304 est géré côté fetcher favoris).
- **Test de propagation** : `route.etag.test.ts` (Lot 1) — MSW upstream renvoie `etag` puis `304` sur `if-none-match` ; assert header forwardé + ETag exposé. + `use-favorites-bootstrap.test.tsx` (Lot 3) — assert « 304 → Set inchangé, pas de refetch corps ».
- **Lot porteur** : extension BFF = **Lot 1** ; consommation 304 = **Lot 3**.

## Section 6 — Page `/account/wishlist` dédiée (Q4/Q6)

- **Structure** : `src/app/(main)/account/wishlist/page.tsx` (Server Component, sous `account/layout.tsx` partagé) + `src/features/wishlist/components/WishlistPageClient.tsx` (`"use client"`).
- **SSR shell** : layout account (sidebar), titre « Liste de souhaits », breadcrumb, skeleton (`loading.tsx`). Rendu serveur, pas de données favoris (le Set est client-only).
- **CSR contenu** : `WishlistPageClient` hydrate via `useQuery(['favorites','page']) → fetchWishlistPage()` (`GET /api/v1/mobile/wishlist`, route page agrégée backend existante, granularité produit — aucun nouvel endpoint backend). Rend des `<ProductCard>` (cœurs branchés post-Lot 4).
- **Empty state** : « Votre liste de souhaits est vide » + CTA retour catalogue.
- **Liens à fixer** : `Footer.tsx:43` (`/account/wishlist`) devient résolu (pas de changement de href) ; CTA « Voir tout » du `WishlistDropdown` repointé `/account` → `/account/wishlist` (au Lot 6, avec le switch dropdown).

## Section 7 — Merge invité au login (Q7 + Q8)

- **⚠️ Réalité pré-vol** : les flux auth terminent par `window.location.href = ...` (**reload dur**), pas de navigation SPA. Un hook « branché sur le success event » ne survivrait pas au reload. → **réconciliation au montage** (honore l'esprit de Q7 « merge au login, tous chemins », sans toucher au frozen auth).
- **Hook `useMergeFavoritesOnLogin()`** : appelé une fois au montage de `WishlistProvider`. Signature : `(): void`. Dépendances : `hasAuthSession()` (auth-service, lecture seule), store favoris (`getGuestIds`, `replaceAll`, `clearGuest`), `bulkMergeFavorites`/`fetchFavoriteIds` (api), `useToast`.
- **Points d'injection (3 flux)** : **aucun** dans les composants auth (frozen). Le merge se déclenche **après** le reload, sur n'importe quelle page (provider racine), dès qu'on détecte `session authentifiée + Set guest non vide en localStorage`. Couvre email/password, OTP, Google **automatiquement** (tous redirigent dur vers une page portant le provider).
- **Séquence exacte** : lire Set local → `POST /mobile/favorites/bulk-merge { ids }` → `GET /mobile/favorites/ids` → `replaceAll(Set propre)` → `clearGuest()`. Garde d'idempotence (flag session) pour éviter double-merge si remontage.
- **`truncated: true`** → `toast.info("Certains favoris n'ont pas pu être transférés (limite atteinte)")`. **`skipped_count > 0`** → `console.info` silencieux. Défaut : silencieux.
- **Test** : `use-merge-favorites-on-login.test.tsx` (MSW bulk-merge + ids ; mock `hasAuthSession`) — cas merge complet, guest vide, non-authentifié, truncated, skipped.

## Section 8 — Cleanup legacy (Lot 7)

Liste exhaustive du code à supprimer :
- `src/features/product/api/product-detail.api.ts` : `fetchWishlist`, `addToWishlist`, `removeFromWishlist`.
- `src/features/product/api/product-detail.schemas.ts` : `WishlistItemSchema`, `WishlistResponseSchema`, type `AddToWishlistPayload`.
- `src/features/header/api/header.api.ts` : `fetchWishlistPreview`, `fetchWishlistCount`.
- `src/features/header/api/header.schemas.ts` : `WishlistPreviewItemSchema`, `WishlistPreviewResponseSchema`, `WishlistCountResponseSchema`.
- `src/components/Header.tsx` : composant mort (non monté).
- Ré-exports : `src/features/product/index.ts` (ligne 9-10 : `addToWishlist, removeFromWishlist, fetchWishlist`, type `AddToWishlistPayload`, `WishlistResponse`) + `src/features/product/api/index.ts` + `src/features/header/index.ts`.
- Tests obsolètes (partiels) : bloc `WishlistResponseSchema` de `product-detail.schemas.test.ts` ; bloc `WishlistPreviewItemSchema` de `header.api.test.ts`. Conserver le reste de ces fichiers.
- Vérifier `src/lib/api/cache.ts` `CacheTags.wishlist()` (retrait si plus consommé).
- Vérifier `x-wishlist-token` dans le BFF (vestige invité par token — **hors scope** ; à laisser, non lié au nouveau système).

## Section 9 — Backlogs post-sprint

- **`SUGU-FAVORITES-MULTITABS-BROADCAST` — P2** : cohérence multi-onglets (BroadcastChannel / `storage` event). `refetchOnWindowFocus` couvre ~90 % en MVP. Reporté : complexité vs valeur MVP faible.
- **`SUGU-FAVORITES-DEPRECATION-TELEMETRY` — P3** : interception headers `Deprecation`/`Sunset` (filtrés par le BFF aujourd'hui). Devient sans objet après migration complète aux routes `/mobile/*`. Reporté : non bloquant.
- **`SUGU-FAVORITES-COUNT-BADGE` — P3** : badge persistant compteur sur l'icône header alimenté par `set.size`. Émergé à la planification ; trivial post-Lot 6 mais non requis par la cible.
- **`SUGU-FAVORITES-OPTIMISTIC-OFFLINE` — P3** : file d'attente offline (PWA absent). Reporté : pas de SW dans le repo.

## Section 10 — Risques globaux

1. **BFF (`route.ts`)** : 2 lignes mais fichier critique partagé par toutes les requêtes. + subtilité 304/`no-store`/`!response.ok` (Section 5). Test exhaustif Lot 1 + Lot 3.
2. **`product-card.tsx`** : carte utilisée home/catégorie/recherche/boutique simultanément. Régression visuelle/perf (ISR, Compiler) → tests réactivité + non-régression Lot 4.
3. **React Compiler + Zustand** : stabilité de référence du Set ; selector pattern obligatoire ; tests de réactivité explicites (Lots 3-4). Ne PAS désactiver le Compiler.
4. **Harness de test inexistant** : RTL+MSW à créer (Lot 1) — tout le sprint en dépend ; nécessite l'unique `npm install`.
5. **Auth = reload dur** : impose la réconciliation-au-montage pour le merge ; un malentendu sur ce point casserait le transfert invité.
6. **Routes legacy Sunset 2026-09-01** : tout retard = risque prod cassée à la date. Le sprint doit atteindre au moins le Lot 6 avant le 01-09.
7. **Cohabitation Lots 1-5** : ne pas casser le toggle détail produit ni le dropdown tant que le switch (Lot 6) n'a pas eu lieu — garanti par l'isolation des fichiers.

## Section 11 — Estimation effort (rough)

| Lot | Jours dev | Incertitude |
|---|---|---|
| 1 — Harness + BFF ETag | 1.5 | **Élevée** (harness from scratch + subtilité 304) |
| 2 — Store + API | 1.5 | Faible |
| 3 — Bootstrap + hooks + merge | 2.5 | **Élevée** (réactivité + merge + 304) |
| 4 — Overlay carte | 1.5 | Moyenne (Compiler/perf) |
| 5 — Page wishlist | 1.0 | Faible |
| 6 — Switch surfaces | 2.0 | **Élevée** (surfaces vivantes) |
| 7 — Cleanup | 1.0 | Faible |
| **Total** | **~11 jours** | Lots à risque : 1, 3, 6 |

## Section 12 — Décisions techniques à valider AVANT exécution (binaires)

1. **Merge invité (Q1)** : confirmer la **réconciliation au montage** (provider détecte `authed + Set guest non vide`) plutôt que le branchement sur un « success event » inexistant (auth = `window.location.href` reload dur) ? **[OUI / NON]**
2. **Testing Library (Q2)** : autoriser l'**unique `npm install` du sprint** au Lot 1 (`@testing-library/react` + `jest-dom` + `user-event`), requis par les décisions 4/13/14 ? **[OUI / NON]**
3. **304/ETag (Q3)** : stratégie 304 = **A** (fetcher favoris dédié gère le 304 hors client central, BFF reste 2 lignes) ou **B** (assouplir `cache-control` BFF pour `/favorites/ids`) ? **[A / B]**
4. **refetchOnWindowFocus (Q4)** : override **par query** sur le bootstrap (défaut global `false` conservé), pas de modif globale de `query-provider.tsx` ? **[OUI / NON]**
5. **Montage provider (Q5)** : monter `<WishlistProvider>` une fois dans `src/app/layout.tsx` (sous `QueryProvider`) ? **[OUI / NON]**
6. **Route page (Q6)** : confirmer `/account/wishlist` (cohérent footer) vs `/favoris` ? **[/account/wishlist / /favoris]**
7. **Endpoints (Q7)** : deux endpoints — `GET /mobile/favorites/ids` (cœurs) + `GET /mobile/wishlist` (page) ? **[OUI / NON]**
8. **Cleanup `Header.tsx` (Q8)** : supprimer le composant mort `Header.tsx` au Lot 7 (terminal), pas avant ? **[OUI / NON]**
9. **Push direct main** : conserver la discipline backend (push direct `main` après gates verts, file-by-file, pas de worktree/PR) ? **[OUI / NON]**

---

*Fin du plan. Aucune implémentation engagée — voir STOP-AND-ASK.*
