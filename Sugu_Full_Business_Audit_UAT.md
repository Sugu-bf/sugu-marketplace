# 📋 SUGU — Audit Complet & Documentation UAT
**Version :** 2.0.0 — Audit Code Source  
**Date :** 2026-03-22  
**Auteur :** Expert System Architect / Lead QA  
**Sources analysées :** `sugu-marketplace` (Next.js 15) + `master_uat.md` (Backend API)  
**Environnement :** mysugu.com (Marketplace) + pro.sugu.pro (SaaS Vendeur/Agence)  

---

## 📌 Légende des Statuts

| Symbole | Signification |
|---------|---------------|
| ⬜ | Non testé |
| ✅ | Passé |
| ❌ | Échoué |
| ⚠️ | Bloquant partiel |
| 🔁 | À retester |

---

# 🔐 MODULE 0 — AUTHENTIFICATION (Client Marketplace)
**Plateforme :** mysugu.com — Pages `/login`, `/register`, `/forgot-password`  
**Code source :** `LoginPageClient.tsx`, `RegisterPageClient.tsx`, `ForgotPasswordPageClient.tsx`

---

### 0.1 — Connexion par Numéro de Téléphone + PIN

**Identifiant :** UAT-AUTH-01 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Accueil → cliquer sur "Se connecter" (header) → page `/login`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Saisir son numéro de téléphone (sélecteur de pays disponible : BF, CI, SN...) | Le champ accepte le format local (ex: 70 00 00 00) |
| 2 | Cliquer sur **"Continuer"** | Le système vérifie si le numéro existe → si OUI avec PIN → étape PIN |
| 3 | Saisir son code PIN (4 cases numériques) | Les 4 cases se remplissent séquentiellement |
| 4 | Cliquer sur **"Se connecter"** | Connexion réussie → redirection vers la page d'origine ou l'accueil |
| 5 | Si PIN oublié → cliquer **"Recevoir un code SMS"** | Basculement vers l'étape OTP SMS |
| 6 | Numéro non reconnu ("Nouveau sur Sugu ?") | Proposition de créer un compte + bouton "Créer mon compte" |
| 7 | Vendeur/Agence → redirection automatique vers `pro.sugu.pro` | Pas de connexion possible sur la marketplace |

**Critère de Succès :** L'utilisateur est connecté, son nom apparaît dans le header, le badge "Vérifié" s'affiche si email confirmé.

---

### 0.2 — Connexion par OTP SMS

**Identifiant :** UAT-AUTH-02 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page `/login` → saisir numéro → étape "Code SMS"

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Numéro avec méthode `otp` (compte Google) → SMS envoyé automatiquement | Affichage de l'étape "Code SMS" avec le numéro masqué |
| 2 | Saisir les 6 chiffres dans les cases OTP | Vérification automatique dès le 6e chiffre saisi |
| 3 | Code invalide | Message d'erreur + les cases se remettent à zéro |
| 4 | Cliquer **"Renvoyer le code"** (après 60s de délai) | Nouveau SMS envoyé, compteur redémarre |
| 5 | Connexion réussie | Redirection vers la page d'origine |

**Critère de Succès :** Token Sanctum stocké en cookie sécurisé, session active pendant 90 jours.

---

### 0.3 — Connexion via Google (Sign In with Google)

**Identifiant :** UAT-AUTH-03 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page `/login` → cliquer **"Continuer avec Google"**

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Cliquer le bouton Google | Popup Google Identity Services s'ouvre |
| 2 | Sélectionner son compte Google | Token ID Google validé côté serveur |
| 3 | Première connexion → compte créé automatiquement | Redirection vers l'accueil en tant qu'utilisateur connecté |
| 4 | Compte existant → connexion directe | Session Sanctum créée, redirection vers page d'origine |

**Critère de Succès :** L'utilisateur est connecté sans avoir saisi de PIN, son nom Google apparaît dans le header.

---

### 0.4 — Inscription (Nouveau Compte Client)

**Identifiant :** UAT-AUTH-04 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page `/login` → "Pas encore de compte ?" → page `/register`

**Étape 1 — Formulaire :**

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Remplir "Nom complet" (min 2 caractères) | Validation en temps réel |
| 2 | Saisir numéro de téléphone avec indicatif pays | Format E.164 validé |
| 3 | Cliquer **"Recevoir le code SMS"** | SMS envoyé, passage à l'étape OTP |

**Étape 2 — Vérification OTP :**

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 4 | Saisir le code à 6 chiffres reçu par SMS | Vérification → "Numéro vérifié ✓" affiché en vert |
| 5 | Code invalide → erreur | Les cases se remettent à zéro |

**Étape 3 — Création du PIN :**

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 6 | Choisir un PIN de 4 chiffres + confirmer | Validation de correspondance des deux PINs |
| 7 | Cliquer **"Créer mon compte"** | Compte créé, session ouverte → redirection accueil |

**Critère de Succès :** Compte actif avec `user_type = "buyer"`, connexion immédiate sans re-saisie.

---

### 0.5 — Mot de Passe / PIN Oublié

**Identifiant :** UAT-AUTH-05 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Page `/login` → "PIN oublié ?" → lien vers `/forgot-password`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Saisir son numéro de téléphone enregistré | Vérification de l'existence du compte |
| 2 | Recevoir un SMS de réinitialisation | Code OTP valide 5 minutes |
| 3 | Saisir le code OTP | Validation → étape de définition du nouveau PIN |
| 4 | Saisir et confirmer le nouveau PIN | PIN mis à jour, connexion automatique |

**Critère de Succès :** Accès au compte restauré avec le nouveau PIN.

---

# 🏠 MODULE 1 — PAGE D'ACCUEIL (Marketplace Client)
**Plateforme :** mysugu.com — Route `/`  
**Code source :** `page.tsx`, `HeroBanners.tsx`, `DailyBestSales.tsx`, `FreshCategories.tsx`, `PromotionalDeals.tsx`, `TrendingStores.tsx`

---

### 1.1 — Navigation Page d'Accueil

**Identifiant :** UAT-HOME-01 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Ouvrir mysugu.com

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Charger la page d'accueil | Bannières hero animées s'affichent (carrousel automatique) |
| 2 | Voir les catégories fraîches | Grille d'icônes de catégories cliquables |
| 3 | Voir les "Meilleures ventes du jour" | Grille de produits avec prix et badges de réduction |
| 4 | Voir les offres promotionnelles | Section dédiée avec compte à rebours si applicable |
| 5 | Voir "Boutiques tendance" | Carrousel des boutiques avec logo, note et nombre de produits |
| 6 | Voir les marques partenaires | Section "Shop By Brands" avec logos cliquables |
| 7 | Lire la newsletter | Section bas de page avec formulaire d'inscription email |

**Critère de Succès :** La page se charge en moins de 3s, toutes les sections sont visibles sans erreur JavaScript.

---

### 1.2 — Barre de Recherche (Header)

**Identifiant :** UAT-HOME-02 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Header → champ de recherche (toujours visible)

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Taper des mots-clés dans la barre de recherche | Suggestions auto-complètes en temps réel (Typesense) |
| 2 | Appuyer sur Entrée ou cliquer la loupe | Redirection vers `/search?q=...` avec les résultats |
| 3 | Effacer la recherche | Suggestions disparaissent, retour à l'état initial |

**Critère de Succès :** Résultats pertinents affichés avec les bonnes images, prix et noms de boutiques.

---

# 🔍 MODULE 2 — RECHERCHE & NAVIGATION CATALOGUE
**Plateforme :** mysugu.com — Routes `/search`, `/category/[slug]`  
**Code source :** `features/search/`

---

### 2.1 — Page de Résultats de Recherche

**Identifiant :** UAT-SEARCH-01 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Header → barre de recherche → saisir → Entrée → page `/search`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Afficher les résultats de recherche | Grille de produits avec photos, noms, prix, notes |
| 2 | Filtrer par catégorie (panneau gauche) | Résultats filtrés dynamiquement |
| 3 | Filtrer par fourchette de prix | Slider de prix, résultats mis à jour |
| 4 | Trier par "Popularité / Prix / Nouveauté" | Ordre des résultats mis à jour |
| 5 | Changer la vue (grille ↔ liste) | Affichage réorganisé |
| 6 | Charger la page suivante (pagination) | Nouveaux produits ajoutés sans rechargement complet |
| 7 | Aucun résultat | Message "Aucun produit trouvé" avec suggestions |

**Critère de Succès :** Résultats affichés en moins de 500ms grâce au cache Redis/ETag.

---

### 2.2 — Navigation par Catégorie

**Identifiant :** UAT-SEARCH-02 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Accueil → cliquer une catégorie → page `/category/[slug]`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Cliquer une catégorie depuis l'accueil | Page catégorie avec fil d'Ariane |
| 2 | Voir les sous-catégories | Onglets ou filtres de sous-catégories disponibles |
| 3 | Filtrer les produits de la catégorie | Filtres prix, tri, disponibilité |

**Critère de Succès :** URL propre `/category/alimentaire`, produits pertinents affichés.

---

# 📦 MODULE 3 — PAGE PRODUIT (Fiche Détail)
**Plateforme :** mysugu.com — Route `/product/[slug]`  
**Code source :** `ProductActions.tsx`, `ProductDetailTabs.tsx`, `ProductImageGallery.tsx`, `ProductPricing.tsx`, `ProductVariants.tsx`, `BulkPriceTable.tsx`

---

### 3.1 — Consultation de la Fiche Produit

**Identifiant :** UAT-PRODUCT-01 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Accueil ou Recherche → cliquer un produit → page `/product/[nom-slug]`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Charger la page produit | Images, titre, prix, stock, vendeur affichés |
| 2 | Naviguer dans la galerie d'images | Miniatures cliquables, zoom sur l'image principale |
| 3 | Voir le prix principal et les badges (Promo, Nouveau) | Prix barré si en promotion, badge coloré |
| 4 | Consulter l'onglet "Description" | Contenu HTML rendu proprement |
| 5 | Consulter l'onglet "Caractéristiques" | Tableau attributs/valeurs |
| 6 | Consulter l'onglet "Avis clients" | Notes et commentaires affichés |
| 7 | Voir le bloc "Produits similaires" | Carrousel de produits de la même catégorie |

**Critère de Succès :** La page génère des balises Open Graph et JSON-LD correctes pour le SEO et Facebook Ads.

---

### 3.2 — Sélection des Variantes Produit

**Identifiant :** UAT-PRODUCT-02 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page Produit → section "Variantes"

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir les options de variantes (Taille, Couleur...) | Boutons de sélection pour chaque option |
| 2 | Cliquer une variante disponible | Bouton sélectionné mis en évidence, prix mis à jour |
| 3 | Variante en rupture de stock | Bouton désactivé ou barré |
| 4 | Changer de variante | Prix et stock recalculés depuis le backend |
| 5 | Voir les prix dégressifs (achat en gros) | Tableau "BulkPriceTable" affiché si applicable |

**Critère de Succès :** Le prix affiché correspond toujours à la variante sélectionnée selon les données backend.

---

### 3.3 — Ajout au Panier depuis la Fiche Produit

**Identifiant :** UAT-PRODUCT-03 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page Produit → sélectionner variante → ajuster quantité → bouton "Ajouter au Panier"

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Ajuster la quantité (+/-) | Compteur mis à jour, total recalculé |
| 2 | Cliquer **"Ajouter au Panier — X FCFA"** | Toast de succès "Ajouté au panier !" avec lien "Voir le panier" |
| 3 | Badge panier dans le header mis à jour | Compteur d'articles incrémenté |
| 4 | Double-clic rapide sur le bouton | Un seul ajout (anti-double-clic actif) |
| 5 | Produit hors stock | Bouton désactivé, message "Rupture de stock" |
| 6 | Stock limité (≤ 20 unités) | Alerte "X restants en stock" en orange |

**Critère de Succès :** L'événement Facebook Pixel `AddToCart` est déclenché avec les bons paramètres (content_ids, value, currency: XOF).

---

### 3.4 — Achat Immédiat ("Acheter Maintenant")

**Identifiant :** UAT-PRODUCT-04 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page Produit → **"Acheter Maintenant"** (bouton accent)

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Cliquer **"Acheter Maintenant"** | Produit ajouté au panier → redirection immédiate vers `/checkout` |
| 2 | Non connecté → cliquer "Acheter Maintenant" | Redirection vers `/login?redirect=/checkout` |

**Critère de Succès :** Le checkout est accessible avec le produit pré-chargé.

---

### 3.5 — Contacter le Vendeur depuis la Fiche Produit

**Identifiant :** UAT-PRODUCT-05 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Page Produit → bouton **"Contacter le vendeur"** (visible si `apiData.seller` présent)

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Cliquer **"Contacter le vendeur"** | Si connecté → conversation créée ou existante ouverte dans `/messages` |
| 2 | Non connecté → cliquer le bouton | Redirection vers la page de connexion |
| 3 | Conversation ouverte | La fiche produit apparaît sous forme de bulle dans le chat |

**Critère de Succès :** Le client et le vendeur peuvent échanger des messages sur ce produit spécifique.

---

# 🛒 MODULE 4 — PANIER
**Plateforme :** mysugu.com — Route `/cart`  
**Code source :** `CartOrchestrator.tsx`, `CartItemCard.tsx`, `OrderSummary.tsx`

---

### 4.1 — Gestion du Panier

**Identifiant :** UAT-CART-01 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Header → icône panier → page `/cart`  
*Accessible aussi depuis le menu "Compte" → "Mon panier"*

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Consulter le panier | Liste des articles avec images, noms, quantités, prix unitaires |
| 2 | Augmenter la quantité d'un article (+) | Quantité mise à jour, sous-total recalculé |
| 3 | Diminuer la quantité d'un article (-) | Quantité réduite (min = 1) |
| 4 | Supprimer un article (icône poubelle) | Article retiré, totaux recalculés |
| 5 | **"Vider le panier"** (lien en haut à droite) | Confirmation → tous les articles supprimés |
| 6 | Voir les alertes de stock limité | Bandeaux orange si stock < quantité souhaitée |
| 7 | Panier vide | Message "Votre panier est vide" + bouton "Découvrir nos produits" |
| 8 | Cliquer **"Continuer mes achats"** | Retour à la page d'accueil |

**Critère de Succès :** Les totaux (sous-total, livraison, réduction, total) proviennent du backend et jamais calculés en local.

---

### 4.2 — Coupon de Réduction dans le Panier

**Identifiant :** UAT-CART-02 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Page `/cart` → section récapitulatif → champ coupon

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Saisir un code coupon valide + cliquer "Appliquer" | Réduction affichée en vert dans le récapitulatif |
| 2 | Code invalide ou expiré | Message d'erreur rouge explicite |
| 3 | Supprimer le coupon (icône ×) | Prix normal rétabli |

**Critère de Succès :** Le montant total diminue du montant exact de la promotion.

---

### 4.3 — Passage à la Caisse depuis le Panier

**Identifiant :** UAT-CART-03 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page `/cart` → bouton **"Passer la commande"**

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Cliquer **"Passer la commande"** | Si connecté → redirection vers `/checkout` |
| 2 | Non connecté → cliquer le bouton | Redirection vers `/login?redirect=/checkout` |
| 3 | Payer par Mobile Money | Redirection vers la page de paiement Moneroo |

**Critère de Succès :** La session de checkout est créée avec les articles et totaux exacts du panier.

---

# 💳 MODULE 5 — CHECKOUT (Processus de Commande)
**Plateforme :** mysugu.com — Route `/checkout`  
**Code source :** `CheckoutOrchestrator.tsx`, `AddressModal.tsx`, `DeliveryAgencyModal.tsx`, `CheckoutOrderSummary.tsx`

---

### 5.1 — Sélection de l'Agence de Livraison

**Identifiant :** UAT-CHECKOUT-01 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page `/checkout` → section "Agence de livraison" → bouton "Modifier"

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir la prévisualisation de l'agence sélectionnée | Nom, logo, note affichés |
| 2 | Cliquer **"Modifier"** → modale des agences | Liste de toutes les agences partenaires disponibles |
| 3 | Sélectionner une agence | Méthodes de livraison de cette agence apparaissent |
| 4 | Choisir une méthode (Standard / Express / Retrait boutique) | Coût de livraison mis à jour dans le récapitulatif |

**Critère de Succès :** Le total de la commande intègre le bon tarif de livraison selon l'agence et la méthode choisies.

---

### 5.2 — Gestion de l'Adresse de Livraison

**Identifiant :** UAT-CHECKOUT-02 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page `/checkout` → section "Adresse de livraison"

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Adresse par défaut pré-sélectionnée | Nom, rue, ville affichés dans la prévisualisation |
| 2 | Cliquer **"Modifier"** → modale adresses | Liste des adresses enregistrées + option "Nouvelle adresse" |
| 3 | Sélectionner une adresse existante | Adresse mise à jour dans le bloc |
| 4 | Créer une nouvelle adresse dans la modale | Formulaire : Nom, Téléphone, Adresse, Ville, Province |
| 5 | Valider sans adresse | Message d'erreur "Veuillez ajouter une adresse de livraison" |

**Critère de Succès :** L'adresse choisie est persistée dans la session checkout avant la validation finale.

---

### 5.3 — Récapitulatif et Validation de la Commande

**Identifiant :** UAT-CHECKOUT-03 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Page `/checkout` → colonne droite → récapitulatif → **"Commander"**

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir le récapitulatif | Articles, sous-total, livraison (selon méthode), réduction coupon, **Total final** |
| 2 | Choisir le mode de paiement : **COD** (paiement à la livraison) | Bouton "Commander — payer à la livraison" |
| 3 | Choisir le mode de paiement : **Mobile Money (Moneroo)** | Bouton "Payer en ligne" |
| 4 | Cliquer **"Commander"** (COD) | Commande créée → redirection vers `/track-order?order=...` |
| 5 | Cliquer **"Payer en ligne"** (Moneroo) | Redirection vers la page de paiement Moneroo |
| 6 | Stock ou prix changé entre-temps | Alerte jaune "Modifications détectées" → session rafraîchie |
| 7 | Validation sans agence/méthode | Message d'erreur "Veuillez choisir une agence de livraison" |

**Critère de Succès :** La commande est créée avec idempotence (double-clic ou retry réseau → une seule commande créée).

---

# 📍 MODULE 6 — SUIVI DE COMMANDE
**Plateforme :** mysugu.com — Route `/track-order?order=[id]`  
**Code source :** `TrackingLiveWrapper.tsx`, `TrackingTimeline.tsx`, `TrackingOrderSummary.tsx`, `TrackingMap.tsx`

---

### 6.1 — Accès au Suivi de Commande

**Identifiant :** UAT-TRACK-01 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Email de confirmation → lien "Suivre ma commande" **OU** Compte → "Mes commandes" → bouton "Détails" → `/track-order?id=...`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Ouvrir le lien de suivi | Page chargée avec le récapitulatif de commande |
| 2 | Voir la timeline de statut | Étapes visuelles : En attente → Confirmée → En préparation → Expédiée → Livrée |
| 3 | Voir les détails de livraison | Nom du coursier (si assigné), numéro de contact |
| 4 | Voir le résumé de commande | Articles commandés, adresse de livraison, montant total |
| 5 | Lien invalide ou commande introuvable | Page d'erreur claire "Commande introuvable" + lien retour |
| 6 | Accès non autorisé (commande d'un autre client) | Page "Accès refusé" avec lien vers login |

**Critère de Succès :** La page se rafraîchit automatiquement (polling toutes les 3s) pour refléter le statut en temps réel.

---

### 6.2 — Réception et Validation par le Client

**Identifiant :** UAT-TRACK-02 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Livraison en cours → coursier arrive → le client reçoit son code de livraison

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Client reçoit notification push avec son code de livraison (8 caractères) | Code visible dans la page de suivi |
| 2 | Client communique le code au coursier | Coursier saisit le code dans son application |
| 3 | Code validé → commande "Livrée" | Statut timeline passe à "Livrée ✓" |
| 4 | Client inspecte les produits reçus (COD) → accepte | Confirmation de réception enregistrée |
| 5 | Client rejette un produit (mauvais article) | Litige ouvert automatiquement, client notifié |

**Critère de Succès :** La timeline se met à jour en temps réel pour refléter chaque étape.

---

# 👤 MODULE 7 — ESPACE CLIENT (Mon Compte)
**Plateforme :** mysugu.com — Routes `/account/*`  
**Code source :** `AccountSidebar.tsx`, `PersonalInfoCard.tsx`, `SecurityCard.tsx`, `AddressListClient.tsx`, `NotificationsClient.tsx`

---

### 7.1 — Tableau de Bord du Compte

**Identifiant :** UAT-ACCOUNT-01 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Header → avatar/nom → "Mon compte" → `/account`

**Menu latéral disponible :**
- Détails du compte
- Mes commandes
- Mon panier
- Mes adresses
- Notifications
- Messages
- Parrainer un ami
- Paramètres du compte
- Centre d'aide
- Se déconnecter

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Accéder à `/account` | Dashboard avec profil, badges de vérification |
| 2 | Badge "Vérifié" sous l'email | S'affiche si `emailVerified = true` |
| 3 | Naviguer dans le menu latéral | Lien actif mis en surbrillance avec bordure primaire |
| 4 | Cliquer **"Se déconnecter"** | Session expirée, redirection vers `/login` |

---

### 7.2 — Informations Personnelles

**Identifiant :** UAT-ACCOUNT-02 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Détails du compte" → section "Informations personnelles"

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir ses informations (Nom, Email, Téléphone, Membre depuis) | Données affichées avec badges "Vérifié" si applicable |
| 2 | Cliquer **"Modifier"** | Modale d'édition avec champs Nom et Téléphone |
| 3 | Modifier le nom et/ou le téléphone | Validation : nom requis (min 1 car.) |
| 4 | Cliquer **"Enregistrer"** | Modifications sauvegardées, modale fermée |
| 5 | L'email est en lecture seule | Champ email désactivé dans la modale |

**Critère de Succès :** Les nouvelles informations apparaissent immédiatement après la fermeture de la modale.

---

### 7.3 — Sécurité du Compte

**Identifiant :** UAT-ACCOUNT-03 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → section "Sécurité"

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir l'état du mot de passe (date dernière modification) | Affiché avec bouton "Modifier" |
| 2 | Cliquer **"Modifier"** (mot de passe) | Modale : "Mot de passe actuel" + "Nouveau" + "Confirmer" |
| 3 | Nouveau mot de passe < 8 caractères | Erreur "Minimum 8 caractères" |
| 4 | Nouveaux mots de passe non identiques | Erreur "Ne correspondent pas" en temps réel |
| 5 | Soumettre avec données valides | "Mot de passe modifié avec succès !" → modale se ferme |
| 6 | Voir le statut 2FA | Badge "Activée" ou "Non activée" |
| 7 | Bouton 2FA | Désactivé ("Disponible prochainement") |

---

### 7.4 — Gestion des Adresses

**Identifiant :** UAT-ACCOUNT-04 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Mes adresses" → `/account/addresses`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir la liste des adresses enregistrées | Cartes avec type (Domicile/Bureau/Famille/Autre), nom, rue, ville, téléphone |
| 2 | Badge "Par défaut" | Visible sur l'adresse de référence |
| 3 | Survoler une adresse → actions | Icônes "Étoile" (défaut), "Crayon" (modifier), "Poubelle" (supprimer) apparaissent |
| 4 | Cliquer **"Ajouter une adresse"** | Modale : Type, Nom complet, Téléphone, Adresse, Complément, Ville, Province |
| 5 | Valider → adresse créée | Carte ajoutée à la liste |
| 6 | Modifier une adresse existante | Modale pré-remplie → "Mettre à jour" |
| 7 | Définir comme adresse par défaut (étoile) | Badge "Par défaut" déplacé sur cette adresse |
| 8 | Supprimer une adresse | Modale de confirmation "Action irréversible" → suppression |
| 9 | Aucune adresse | Message "Ajoutez votre première adresse" + bouton |

**Critère de Succès :** L'adresse par défaut est automatiquement pré-sélectionnée au checkout.

---

### 7.5 — Mes Commandes

**Identifiant :** UAT-ACCOUNT-05 | **Priorité :** 🔴 Critique | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Mes commandes" → `/account/orders`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir la liste des commandes | Référence, date, articles (aperçu), statut coloré, montant total |
| 2 | Statuts affichés : En attente / Confirmée / En préparation / En livraison / Livrée / Annulée | Badge coloré selon le statut |
| 3 | Cliquer **"Détails"** sur une commande | Redirection vers `/track-order?id=...` |
| 4 | Aucune commande | Message "Vous n'avez pas encore passé de commande" + bouton "Commencer à acheter" |

---

### 7.6 — Notifications

**Identifiant :** UAT-ACCOUNT-06 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Notifications" → `/account/notifications`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir les notifications groupées par date | Groupes "Aujourd'hui", "Hier", etc. |
| 2 | Notification non lue → fond bleuté + point indicateur | Visuellement distincte des notifications lues |
| 3 | Cliquer une notification non lue | Marquée comme lue instantanément (mise à jour optimiste) |
| 4 | Cliquer **"Tout marquer comme lu"** | Toutes passent en lues en une seule action |
| 5 | Types de notifications : commande confirmée, expédiée, livrée, annulée, paiement, promo, rupture stock | Icône et couleur spécifique par type |
| 6 | Notification avec lien d'action | Cliquable → redirige vers commande ou produit concerné |

---

### 7.7 — Programme de Parrainage

**Identifiant :** UAT-ACCOUNT-07 | **Priorité :** 🟡 Moyenne | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Parrainer un ami" → `/account/referral`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir son code de parrainage unique | Code personnel affiché |
| 2 | Cliquer **"Copier le lien"** | Lien d'invitation copié dans le presse-papiers |
| 3 | Partager via les réseaux sociaux | Boutons de partage WhatsApp, etc. disponibles |
| 4 | Voir ses filleuls et récompenses | Historique des parrainages et gains |

---

### 7.8 — Paramètres du Compte

**Identifiant :** UAT-ACCOUNT-08 | **Priorité :** 🟡 Moyenne | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Paramètres du compte" → `/account/settings`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir les préférences (langue, devise, thème) | Options affichées avec valeurs actuelles |
| 2 | Modifier les préférences | Sauvegarde immédiate |
| 3 | Section "Confidentialité des données" | Informations RGPD, options d'export/suppression |

---

# 💬 MODULE 8 — MESSAGERIE TEMPS RÉEL
**Plateforme :** mysugu.com — Route `/messages` et `/messages/[conversationId]`  
**Code source :** `MessagingPage.tsx`, `ChatRoom.tsx`, `ConversationList.tsx`, `Composer.tsx`, `ContactPanel.tsx`

---

### 8.1 — Liste des Conversations

**Identifiant :** UAT-MSG-01 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Messages" → `/messages`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir la liste des conversations | Avatars, noms de boutiques, dernier message, heure |
| 2 | Badge de messages non lus | Compteur rouge sur chaque conversation non lue |
| 3 | Sélectionner une conversation | Chat room s'ouvre (panneau central) |
| 4 | Aucune conversation | État "Aucune conversation" affiché |

---

### 8.2 — Interface de Chat

**Identifiant :** UAT-MSG-02 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** `/messages` → sélectionner une conversation

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir l'historique des messages | Bulles client (droite) et vendeur (gauche), séparateurs de date |
| 2 | Voir la fiche produit liée (si démarrée depuis un produit) | "ProductCardBubble" avec image et nom du produit |
| 3 | Saisir un message dans le compositeur | Zone de texte active |
| 4 | Appuyer Entrée ou cliquer Envoyer | Message envoyé, affiché instantanément |
| 5 | Indicateur de frappe ("... est en train d'écrire") | Visible si l'interlocuteur tape |
| 6 | Accusés de lecture (✓✓) | Visible sous les messages envoyés |
| 7 | Nouveau message en temps réel (WebSocket/Reverb) | Message apparaît sans rechargement |
| 8 | Mobile → vue unique (liste OU chat) | Bouton "Retour" pour revenir à la liste |

**Critère de Succès :** La messagerie temps réel fonctionne via le canal privé `messaging.user.{id}`.

---

### 8.3 — Panneau Contact Vendeur

**Identifiant :** UAT-MSG-03 | **Priorité :** 🟡 Moyenne | **Statut :** ⬜

**Parcours Utilisateur :** `/messages` → conversation active → panneau droit (desktop uniquement)

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir les infos du vendeur | Photo, nom de boutique, statut en ligne |
| 2 | Voir les produits liés | Liste des produits de la conversation |
| 3 | Cliquer sur un produit | Redirection vers la fiche produit |

---

# 🏪 MODULE 9 — PAGE BOUTIQUE
**Plateforme :** mysugu.com — Routes `/store/[slug]`, `/stores`  
**Code source :** `StorePageClient.tsx`, `StoreHeroBanner.tsx`, `StoreAboutSection.tsx`, `FollowButton.tsx`

---

### 9.1 — Consultation d'une Page Boutique

**Identifiant :** UAT-STORE-01 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Accueil → boutique tendance **OU** `/stores` → sélectionner une boutique → `/store/[slug]`

| # | Action | Résultat Attendu |
|---|--------|-----------------|
| 1 | Voir la bannière hero de la boutique | Logo, nom, description, note, nombre de produits |
| 2 | Voir la section "À propos" | Description de la boutique, politique de retour |
| 3 | Cliquer **"Suivre"** la boutique | Bouton change → "Abonné" (avec icône check) |
| 4 | Cliquer **"Contacter"** | Ouverture de la messagerie avec ce vendeur |
| 5 | Voir la grille de produits (vue Grille par défaut) | Produits avec photos, prix, badges promotions |
| 6 | Changer en vue Liste | Affichage linéaire des produits |
| 7 | Trier les produits (Populaires, Nouveautés, Prix croissant/décroissant, Meilleures notes) | Produits réorganisés sans rechargement complet |
| 8 | Filtrer par catégorie (onglets) | Produits filtrés côté client |
| 9 | Rechercher dans la boutique | Barre de recherche avec debounce 300ms |
| 10 | Cliquer **"Charger plus de produits"** | Chargement des produits suivants (cursor pagination) |

**Critère de Succès :** La boutique affiche ses produits réels avec les bonnes options de filtrage.

---

# 🎧 MODULE 10 — CHAT SUPPORT (Widget Flottant)
**Plateforme :** mysugu.com — Présent sur toutes les pages + `/support-chat`  
**Code source :** `SupportChatWidget.tsx`, `features/support-chat/api.ts`

---

### 10.1 — Démarrer une Session de Support

**Identifiant :** UAT-SUPPORT-01 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** N'importe quelle page → bouton orange flottant (bas droite) **OU** Menu → Centre d'aide → Chat support → `/support-chat`

| # | Action | Résultat Attendu |
|---|--------|------------------|
| 1 | Voir le bouton rond orange flottant en bas à droite | Bouton visible sur **toutes** les pages du site |
| 2 | Cliquer le bouton → fenêtre de chat s'ouvre | Formulaire de démarrage : champ "Sujet" (optionnel) + bouton "Démarrer le chat" |
| 3 | Cliquer **"Démarrer le chat"** | Conversation créée, statut "En attente d'un agent..." (animation 3 points) |
| 4 | Agent répond → statut devient "Avec [Nom de l'agent]" | Nom de l'agent affiché dans le header de la fenêtre |
| 5 | Badge rouge sur le bouton flottant (messages non lus) | Apparaît si un message arrive quand la fenêtre est fermée |

---

### 10.2 — Échange dans la Fenêtre de Chat Support

**Identifiant :** UAT-SUPPORT-02 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Bouton flottant → chat ouvert → zone de saisie

| # | Action | Résultat Attendu |
|---|--------|------------------|
| 1 | Taper un message + Entrée ou bouton Envoyer | Message envoyé visible immédiatement (bulle orange droite) |
| 2 | Recevoir la réponse de l'agent | Bulle blanche côté gauche avec nom de l'agent + heure |
| 3 | Le chat se rafraîchit toutes les 5 secondes (polling) | Nouveaux messages apparaissent sans rechargement |
| 4 | Messages avec pièces jointes images | Miniatures affichées inline, clic → ouverture en plein écran |
| 5 | Messages avec pièces jointes fichiers | Lien de téléchargement avec nom et icône fichier |
| 6 | Fermer la fenêtre de chat | Fenêtre disparaît, conversation reste active (bouton rouge) |
| 7 | Rouvrir le chat → conversation retrouvée | Historique des messages restauré automatiquement |
| 8 | Cliquer **"Terminer le chat"** (icône ×) | Confirmation → "Chat terminé" + option "Démarrer un nouveau chat" |

**Critère de Succès :** Le badge du bouton flottant affiche le bon compteur de messages non lus même quand la fenêtre est fermée.

---

### 10.3 — Contacts Alternatifs Support

**Identifiant :** UAT-SUPPORT-03 | **Priorité :** 🟡 Moyenne | **Statut :** ⬜

**Parcours Utilisateur :** Centre d'aide → `/support-chat` → section "Autres moyens de nous contacter"

| # | Contact | Résultat Attendu |
|---|---------|------------------|
| 1 | Téléphone : **+226 25 00 00 00** | Lien `tel:` → appel téléphonique déclenché |
| 2 | WhatsApp : **+226 70 00 00 00** | Lien `wa.me/` → ouverture de WhatsApp |
| 3 | Email : **support@sugu.pro** | Lien `mailto:` → client email ouvert |

---

# 🧾 MODULE 11 — FACTURES EN LIGNE
**Plateforme :** mysugu.com — Route `/invoices/[token]`  
**Code source :** `app/invoices/[token]/page.tsx`

---

### 11.1 — Consultation et Téléchargement d'une Facture

**Identifiant :** UAT-INVOICE-01 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Email de confirmation → lien "Voir ma facture" → `/invoices/[token]`  
*(accessible sans connexion via token signé)*

| # | Action | Résultat Attendu |
|---|--------|------------------|
| 1 | Ouvrir le lien de facture (avec token valide) | Page facture chargée avec design professionnel Sugu |
| 2 | Voir l'en-tête de la facture | Numéro de facture, date d'émission, statut (Draft/Émise/Payée/Partiellement payée/En retard) |
| 3 | Voir les informations vendeur ("De") | Nom boutique, adresse, téléphone, email |
| 4 | Voir les informations client ("Facturé à") | Nom client, téléphone, email, adresse de facturation |
| 5 | Voir le tableau des articles | Colonnes : Article, SKU, Qté, Prix unitaire, Total |
| 6 | Voir le récapitulatif financier | Sous-total, Livraison, Remise, Taxes, **Total en FCFA** |
| 7 | Voir "Payé" et "Reste à payer" (si paiement partiel) | Montants distincts affichés en couleurs |
| 8 | Cliquer **"Télécharger PDF"** | Téléchargement du fichier PDF via le lien `download_url` |
| 9 | Token invalide ou facture introuvable | Page 404 "Facture introuvable" |

**Critère de Succès :** La facture est accessible sans connexion (route publique) via son token signé unique, non indexée par les moteurs de recherche.

---

# ⚙️ MODULE 12 — PRÉFÉRENCES & CONFIDENTIALITÉ
**Plateforme :** mysugu.com — Route `/account/settings`  
**Code source :** `PreferencesCard.tsx`, `DataPrivacyCard.tsx`

---

### 12.1 — Préférences de Notifications et Localisation

**Identifiant :** UAT-PREF-01 | **Priorité :** 🟡 Moyenne | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Paramètres du compte" → section "Préférences"

| # | Action | Résultat Attendu |
|---|--------|------------------|
| 1 | Voir les toggles de notifications | 3 interrupteurs : Newsletter, Notifications Push, SMS |
| 2 | Activer/Désactiver **Newsletter** | Toggle mis à jour + sauvegarde auto (debounce 500ms) |
| 3 | Activer/Désactiver **Notifications Push** | Toggle mis à jour + sauvegarde automatique |
| 4 | Activer/Désactiver **Notifications SMS** | Toggle mis à jour + sauvegarde automatique |
| 5 | Changer la **Langue** (Français / English / العربية) | Select mis à jour + sauvegarde auto | 
| 6 | Changer la **Devise** (FCFA / EUR / USD) | Select mis à jour + sauvegarde auto |
| 7 | Indicateur "Enregistrement..." visible | Affiché pendant la requête API (animé) |

**Critère de Succès :** Les préférences persistent après déconnexion/reconnexion.

---

### 12.2 — Données & Confidentialité (RGPD)

**Identifiant :** UAT-PRIVACY-01 | **Priorité :** 🟠 Haute | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Paramètres du compte" → section "Données et confidentialité"

| # | Action | Résultat Attendu |
|---|--------|------------------|
| 1 | Voir le bouton **"Exporter mes données"** | Bouton avec icône téléchargement |
| 2 | Cliquer **"Exporter"** | Fichier JSON téléchargé nommé `sugu-mes-donnees-YYYY-MM-DD.json` |
| 3 | Bouton passe à **"Téléchargé ✓"** pendant 3s | Feedback visuel de succès |
| 4 | Voir le bouton **"Supprimer mon compte"** (zone rouge) | Alerte visuelle "Action irréversible" |
| 5 | Cliquer **"Supprimer"** → modale de confirmation | Avertissement clair + champ "Mot de passe" requis |
| 6 | Saisir le mot de passe + confirmer | Compte supprimé → redirection vers l'accueil |
| 7 | Mot de passe incorrect | Message d'erreur explicite, compte non supprimé |
| 8 | Annuler la suppression | Modale fermée, compte intact |

**Critère de Succès :** La suppression de compte est irréversible et nécessite confirmation par mot de passe (conformité RGPD).

---

### 12.3 — Page Paiements (Informative)

**Identifiant :** UAT-PAY-01 | **Priorité :** 🟡 Moyenne | **Statut :** ⬜

**Parcours Utilisateur :** Mon compte → "Mes paiements" → `/account/payments`

| # | Action | Résultat Attendu |
|---|--------|------------------|
| 1 | Accéder à la page | Page informative (pas de méthodes de paiement sauvegardées) |
| 2 | Voir les modes de paiement acceptés | Orange Money, Moov Money, Cartes bancaires, COD |
| 3 | Cliquer **"Voir mes commandes"** | Redirection vers `/account/orders` |

**Note :** Le backend ne supporte pas les méthodes de paiement enregistrées. Les paiements sont traités à chaque commande via Moneroo (redirection) ou COD.

---

# 📜 MODULE 13 — PAGES LÉGALES & INFORMATIVES
**Plateforme :** mysugu.com — Routes statiques

---

### 13.1 — Pages Informatives

**Identifiant :** UAT-LEGAL-01 | **Priorité :** 🟡 Moyenne | **Statut :** ⬜

| Route | Contenu attendu |
|-------|----------------|
| `/conditions-generales` | CGU/CGV de Sugu |
| `/politique-de-confidentialite` | Politique RGPD |
| `/politique-livraison-retours` | Frais et délais de livraison, conditions de retour |
| `/politique-anti-fraude` | Politique de lutte contre la fraude |
| `/help` | Centre d'aide avec questions fréquentes |
| `/fournisseurs` | Page dédiée aux fournisseurs/grossistes |
| `/blog` | Articles et actualités Sugu |
| `/onboarding` | Redirige vers `/register` (compatibilité anciens liens) |
| `/banners` | Page bannières promotionnelles |
| `/pages/[slug]` | Pages CMS dynamiques (contenu géré côté backend) |

**Critère de Succès :** Toutes les pages se chargent sans erreur 404, contenu lisible et structuré.

---

# 🛡️ MODULE 14 — SÉCURITÉ TRANSVERSALE (Frontend)
**Code source :** `proxy.ts`, `lib/api/auth.ts`, `lib/api/client.ts`

---

### 11.1 — Protection des Routes Authentifiées

**Identifiant :** UAT-SEC-FE-01 | **Priorité :** 🔴 Critique | **Statut :** ⬜

| # | Scénario | Résultat Attendu |
|---|---------|-----------------|
| SEC-FE-01 | Accéder à `/account` sans être connecté | Redirection vers `/login?redirect=/account` |
| SEC-FE-02 | Accéder à `/checkout` sans être connecté | Redirection vers `/login?redirect=/checkout` |
| SEC-FE-03 | Accéder à `/messages` sans être connecté | Redirection vers `/login` |
| SEC-FE-04 | Token expiré → appel API | Tentative de refresh silencieux → si échoue → logout |
| SEC-FE-05 | Connexion vendeur/agence sur marketplace | Redirection automatique vers `pro.sugu.pro` |

---

### 11.2 — SEO & Performances

**Identifiant :** UAT-SEC-FE-02 | **Priorité :** 🟠 Haute | **Statut :** ⬜

| # | Scénario | Résultat Attendu |
|---|---------|-----------------|
| SEO-01 | Inspecter les balises `<title>` et `<meta description>` | Uniques et descriptives pour chaque page |
| SEO-02 | Inspecter les balises Open Graph (`og:image`, `og:title`) | Présentes sur les pages produit et boutique |
| SEO-03 | Inspecter le JSON-LD sur la fiche produit | Schema `Product` valide avec prix, disponibilité |
| SEO-04 | Vérifier `robots.txt` | Exclut `/account/*`, `/checkout`, `/cart` de l'indexation |
| SEO-05 | Tester le Sitemap XML | `/sitemap.xml` accessible avec les URLs produit/boutique/catégorie |
| SEO-06 | Pixel Facebook — événement `ViewContent` sur fiche produit | Déclenché au chargement avec les bons paramètres |
| SEO-07 | Pixel Facebook — événement `AddToCart` | Déclenché avec `content_ids`, `value`, `currency: XOF` |
| SEO-08 | Pixel Facebook — événement `Purchase` | Déclenché après commande validée avec montant total |

---

# 📊 RÉSUMÉ EXÉCUTIF — AUDIT FRONTEND SUGU MARKETPLACE

## Fonctionnalités Majeures Découvertes

### 🆕 Fonctionnalités non documentées dans master_uat.md

| # | Fonctionnalité | Module | Priorité |
|---|---------------|--------|----------|
| 1 | **Messagerie temps réel** (WebSocket/Reverb) entre client et vendeur | Messaging | 🟠 Haute |
| 2 | **Contacter le Vendeur** depuis la fiche produit | Product | 🟠 Haute |
| 3 | **Programme de Parrainage** (code + lien de partage) | Account | 🟡 Moyenne |
| 4 | **Authentification SMS 3 étapes** : Info → OTP → PIN | Auth | 🔴 Critique |
| 5 | **Connexion Google (GIS)** avec validation côté serveur | Auth | 🔴 Critique |
| 6 | **Suivi en temps réel** avec polling automatique (TrackingLiveWrapper) | Order | 🔴 Critique |
| 7 | **Gestion des adresses CRUD** (création, modification, suppression, par défaut) | Account | 🟠 Haute |
| 8 | **Prix dégressifs (Bulk Pricing)** sur les fiches produit | Product | 🟠 Haute |
| 9 | **Variantes produit** avec résolution backend (stock et prix par variante) | Product | 🔴 Critique |
| 10 | **Idempotence commande** (double-clic / retry réseau = 1 seule commande) | Checkout | 🔴 Critique |
| 11 | **Facebook Pixel** intégré (ViewContent, AddToCart, Purchase) | Analytics | 🟠 Haute |
| 12 | **SEO JSON-LD** (schema Product, BreadcrumbList) | SEO | 🟠 Haute |
| 13 | **Page Boutique avancée** (filtre, tri, recherche interne, pagination cursor) | Store | 🟠 Haute |
| 14 | **Proxy Edge avec cache in-memory** pour les redirections legacy | Infra | 🟡 Moyenne |
| 15 | **Notifications groupées par date** avec marquage individuel et collectif | Account | 🟡 Moyenne |
| 16 | **Chat Support widget flottant** (polling 5s, pièces jointes, statuts agent) | Support | 🟠 Haute |
| 17 | **Factures en ligne** accessibles via token public (sans connexion) + PDF | Invoices | 🟠 Haute |
| 18 | **Préférences Notifications** (Newsletter, Push, SMS — toggles auto-save) | Account | 🟡 Moyenne |
| 19 | **Préférences Langue & Devise** (FR/EN/AR + FCFA/EUR/USD) | Account | 🟡 Moyenne |
| 20 | **Données & Confidentialité RGPD** (export JSON + suppression compte) | Account | 🟠 Haute |

---

## Tableau de Bord des Tests

| Module | # Scénarios | 🔴 Critique | 🟠 Haute | 🟡 Moyenne |
|--------|------------|------------|---------|-----------|
| Authentification (AUTH) | 5 | 4 | 1 | 0 |
| Accueil & Navigation (HOME) | 2 | 1 | 1 | 0 |
| Recherche & Catalogue (SEARCH) | 2 | 1 | 1 | 0 |
| Fiche Produit (PRODUCT) | 5 | 3 | 2 | 0 |
| Panier (CART) | 3 | 2 | 1 | 0 |
| Checkout (CHECKOUT) | 3 | 3 | 0 | 0 |
| Suivi Commande (TRACK) | 2 | 2 | 0 | 0 |
| Espace Client (ACCOUNT) | 11 | 2 | 5 | 4 |
| Messagerie (MSG) | 3 | 0 | 2 | 1 |
| Boutique (STORE) | 1 | 0 | 1 | 0 |
| Chat Support (SUPPORT) | 3 | 0 | 2 | 1 |
| Factures en ligne (INVOICE) | 1 | 0 | 1 | 0 |
| Légal & Informatif (LEGAL) | 1 | 0 | 0 | 1 |
| Sécurité Frontend (SEC-FE) | 2 | 1 | 1 | 0 |
| **TOTAL FRONTEND** | **44** | **19** | **18** | **7** |
| *Backend (master_uat.md)* | *118* | *78* | *28* | *12* |
| **TOTAL GLOBAL** | **162** | **97** | **46** | **19** |

---

## 🚦 Critères de Go/No-Go

| Critère | Seuil exigé |
|---------|-------------|
| Taux de réussite global | ≥ 95% |
| Tests critiques (🔴) | 100% passés |
| Zéro bug sur parcours Ajout Panier → Checkout → Commande | Obligatoire |
| Zéro faille IDOR côté frontend et backend | Obligatoire |
| Pixel Facebook fonctionnel (AddToCart, Purchase) | Obligatoire avant campagnes |
| Messagerie temps réel stable | Obligatoire |
| SEO — balises Open Graph valides sur produits | Obligatoire |

---

## 📝 Glossaire Étendu

| Terme | Définition |
|-------|-----------|
| **COD** | Cash On Delivery — paiement à la livraison |
| **KYC** | Know Your Customer — vérification d'identité |
| **POD** | Proof Of Delivery — photo/signature de livraison |
| **OTP** | One Time Password — code SMS à usage unique |
| **PIN** | Code numérique à 4 chiffres pour la connexion mobile |
| **Bulk Pricing** | Tarif dégressif selon la quantité commandée |
| **Cursor Pagination** | Pagination basée sur un curseur (next_cursor) pour les listes infinies |
| **WebSocket/Reverb** | Protocole de communication temps réel pour la messagerie |
| **GIS** | Google Identity Services — SDK de connexion Google |
| **Idempotence** | Propriété garantissant qu'une même action ne peut produire qu'un seul résultat |
| **Edge/Proxy** | Middleware Next.js exécuté à la périphérie du réseau (Edge Runtime) |
| **ULID** | Identifiant unique trié chronologiquement |
| **Pickup Code** | Code 8 caractères vendeur ↔ coursier pour valider le ramassage |
| **Delivery Code** | Code 8 caractères client ↔ coursier pour confirmer la livraison |
