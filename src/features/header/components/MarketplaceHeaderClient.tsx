"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  User,
  Menu,
  X,
  Package,
  MapPin,
  Ticket,
  Truck,
  Trash2,
  Sparkles,
  LogOut,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { HeaderCategory } from "../api/header.schemas";
import SearchBar from "./SearchBar";
import CategoriesMegaMenu from "./CategoriesMegaMenu";
import WishlistDropdown from "./WishlistDropdown";
import CartDropdown from "./CartDropdown";
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "../state/recentSearches.cookie";
import { getAuthUser, logout, type AuthUser } from "@/lib/api/auth";
import { useSearchSuggestions } from "../hooks/useSearchSuggestions";
import { formatPrice } from "@/lib/constants";

// ─── Nav Links ───────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Produits", href: "/search" },
  { label: "Fournisseurs", href: "/fournisseurs" },
  { label: "Actualités", href: "/blog" },
] as const;

// ─── Props ───────────────────────────────────────────────────

interface MarketplaceHeaderClientProps {
  /** Category tree for mega menu (from server) */
  categories: HeaderCategory[];
  /** Popular search terms derived from categories (from server) */
  popularSearches: string[];
}

/**
 * MarketplaceHeaderClient — interactive shell for the global header.
 *
 * Receives pre-fetched public data (categories, popular searches) from the
 * server component wrapper. Owns all interactive state:
 * - Mobile menu toggle
 * - Mobile search overlay
 * - User account dropdown
 * - Scroll shadow
 *
 * Delegates:
 * - Search bar / dropdown → <SearchBar>
 * - Categories mega menu → <CategoriesMegaMenu>
 * - Wishlist dropdown → <WishlistDropdown>
 * - Cart dropdown → <CartDropdown>
 */
export default function MarketplaceHeaderClient({
  categories,
  popularSearches,
}: MarketplaceHeaderClientProps) {
  const router = useRouter();

  // ── State ──
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileRecentSearches, setMobileRecentSearches] = useState<string[]>([]);
  const [userOpen, setUserOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const userTimeout = useRef<NodeJS.Timeout | null>(null);

  // ── Auth state detection ──
  const checkAuth = useCallback(async () => {
    // Quick check: if no auth_token cookie, skip the API call
    const hasToken = document.cookie
      .split("; ")
      .some((row) => row.startsWith("auth_token="));

    if (!hasToken) {
      setAuthUser(null);
      setAuthLoading(false);
      return;
    }

    try {
      const user = await getAuthUser();
      setAuthUser(user);
    } catch {
      setAuthUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Check auth on mount and on window focus (tab switch back)
  useEffect(() => {
    checkAuth();

    const onFocus = () => checkAuth();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [checkAuth]);

  // ── Logout handler ──
  const handleLogout = useCallback(async () => {
    setUserOpen(false);
    try {
      await logout();
    } catch {
      // Clear cookie even on error
      document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
    }
    setAuthUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  // ── Scroll detection ──
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Mobile search open/close ──
  const openMobileSearch = useCallback(() => {
    setMobileRecentSearches(getRecentSearches());
    setMobileSearchOpen(true);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSearchOpen]);

  // ── Mobile search handlers ──
  const handleMobileSearchSelect = useCallback(
    (term: string) => {
      setMobileSearchQuery(term);
      setMobileRecentSearches(addRecentSearch(term));
      setMobileSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(term)}`);
    },
    [router]
  );

  const handleMobileSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = mobileSearchQuery.trim();
      if (!trimmed) return;
      setMobileRecentSearches(addRecentSearch(trimmed));
      setMobileSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [mobileSearchQuery, router]
  );

  const handleMobileRemoveRecent = useCallback((term: string) => {
    setMobileRecentSearches(removeRecentSearch(term));
  }, []);

  const handleMobileClearRecent = useCallback(() => {
    setMobileRecentSearches(clearRecentSearches());
  }, []);

  // ── Mobile live suggestions ──
  const {
    suggestions: mobileSuggestions,
    isLoading: mobileSuggestionsLoading,
    clear: clearMobileSuggestions,
  } = useSearchSuggestions(mobileSearchOpen ? mobileSearchQuery : "");

  const handleMobileSelectProduct = useCallback(
    (slug: string) => {
      const trimmed = mobileSearchQuery.trim();
      if (trimmed) addRecentSearch(trimmed);
      setMobileSearchOpen(false);
      clearMobileSuggestions();
      router.push(`/product/${slug}`);
    },
    [mobileSearchQuery, router, clearMobileSuggestions]
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled ? "shadow-lg" : "shadow-sm"
      )}
      id="marketplace-header"
    >
      {/* ── Main Header Bar (Orange Gradient) ── */}
      <div className="bg-gradient-to-r from-primary via-primary-600 to-primary-dark">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-2.5 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group flex-shrink-0"
            aria-label="Sugu — Accueil"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-110 bg-white/10 p-0.5">
              <Image
                src="/logo.png"
                alt="Sugu"
                fill
                className="object-contain"
                priority
                sizes="40px"
              />
            </div>
          </Link>

          {/* Burger + "Toutes les catégories" (Desktop) */}
          <CategoriesMegaMenu categories={categories} />

          {/* Search Bar (Desktop) */}
          <SearchBar
            popularSearches={popularSearches}
            className="hidden md:block"
          />

          {/* Nav Links (Desktop) */}
          <nav
            className="hidden lg:flex items-center gap-5 flex-shrink-0"
            aria-label="Navigation principale"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-white/85 transition-all duration-200 hover:text-white whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Mobile search trigger */}
            <button
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white"
              onClick={openMobileSearch}
              aria-label="Ouvrir la recherche"
            >
              <Search size={20} />
            </button>

            {/* User Icon + Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => {
                if (userTimeout.current) clearTimeout(userTimeout.current);
                setUserOpen(true);
              }}
              onMouseLeave={() => {
                userTimeout.current = setTimeout(() => setUserOpen(false), 200);
              }}
            >
              <Link
                href={authUser ? "/account" : "/login"}
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white"
                aria-label={authUser ? "Mon compte" : "Se connecter"}
                id="header-user-trigger"
              >
                <User size={20} />
                {authUser && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-primary-dark" />
                )}
              </Link>
              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white shadow-xl border border-gray-100 py-2 z-50 hidden md:block animate-fade-slide-down">
                  {authUser ? (
                    <>
                      {/* Logged in header */}
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-bold text-foreground truncate">
                          {authUser.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {authUser.email}
                        </p>
                      </div>
                      {[
                        { label: "Mon compte", href: "/account", Icon: User },
                        { label: "Mes commandes", href: "/account/orders", Icon: Package },
                        { label: "Mes adresses", href: "/account/addresses", Icon: MapPin },
                        { label: "Mes coupons", href: "/account/coupons", Icon: Ticket },
                        { label: "Suivre ma commande", href: "/track-order", Icon: Truck },
                      ].map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-primary-50 hover:text-primary transition-colors duration-150"
                          onClick={() => setUserOpen(false)}
                        >
                          <item.Icon
                            size={16}
                            className="text-muted-foreground"
                          />
                          {item.label}
                        </Link>
                      ))}
                      <div className="px-4 pt-2 pb-1 border-t border-border mt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-foreground/80 transition-all duration-200 hover:bg-gray-200 active:scale-95"
                        >
                          <LogOut size={16} />
                          Déconnexion
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Guest header */}
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-bold text-foreground">Mon Compte</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Gérez votre profil
                        </p>
                      </div>
                      {[
                        { label: "Mon compte", href: "/account", Icon: User },
                        { label: "Mes commandes", href: "/account/orders", Icon: Package },
                        { label: "Mes adresses", href: "/account/addresses", Icon: MapPin },
                        { label: "Mes coupons", href: "/account/coupons", Icon: Ticket },
                        { label: "Suivre ma commande", href: "/track-order", Icon: Truck },
                      ].map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/80 hover:bg-primary-50 hover:text-primary transition-colors duration-150"
                          onClick={() => setUserOpen(false)}
                        >
                          <item.Icon
                            size={16}
                            className="text-muted-foreground"
                          />
                          {item.label}
                        </Link>
                      ))}
                      <div className="px-4 pt-2 pb-1 border-t border-border mt-1">
                        <Link
                          href="/login"
                          className="block w-full rounded-xl bg-primary py-2.5 text-center text-sm font-bold text-white transition-all duration-200 hover:bg-primary-dark active:scale-95"
                          onClick={() => setUserOpen(false)}
                        >
                          Se connecter
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Dropdown */}
            <WishlistDropdown />

            {/* Cart Dropdown */}
            <CartDropdown />

            {/* Mobile hamburger */}
            <button
              className="ml-1 flex lg:hidden items-center justify-center rounded-lg p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu (nav links) ── */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 bg-white md:hidden",
          mobileMenuOpen ? "max-h-60 px-4 pb-3" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-1 pt-2" aria-label="Navigation mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-primary-50 hover:text-primary transition-colors duration-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Mobile Search Fullscreen Overlay ── */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-white md:hidden">
          {/* Dark top bar */}
          <div className="flex items-center gap-3 bg-gray-900 px-4 py-3">
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:text-white transition-colors"
              aria-label="Fermer la recherche"
            >
              <X size={22} />
            </button>
            <form onSubmit={handleMobileSearchSubmit} className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                placeholder="Rechercher par nom de produit"
                className="w-full rounded-full bg-gray-800 pl-9 pr-4 py-2 text-sm text-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/20 transition-all duration-200"
                autoComplete="off"
              />
            </form>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {/* ── Live Suggestions (when typing ≥ 2 chars) ── */}
            {mobileSearchQuery.trim().length >= 2 ? (
              <div>
                {/* Loading */}
                {mobileSuggestionsLoading && mobileSuggestions.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span>Recherche en cours…</span>
                  </div>
                )}

                {/* Product suggestions */}
                {mobileSuggestions.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Produits suggérés
                    </h4>
                    <ul className="space-y-1">
                      {mobileSuggestions.map((product) => (
                        <li key={product.id}>
                          <button
                            onClick={() => handleMobileSelectProduct(product.slug)}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-all duration-200 hover:bg-primary-50 active:scale-[0.98] group"
                          >
                            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                              <img
                                src={product.thumbnail || undefined}
                                alt={product.name}
                                className="h-full w-full object-contain p-0.5"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              {product.highlightName ? (
                                <p
                                  className="text-sm font-medium text-foreground truncate [&_mark]:font-bold [&_mark]:text-primary [&_mark]:bg-transparent"
                                  dangerouslySetInnerHTML={{ __html: product.highlightName }}
                                />
                              ) : (
                                <p className="text-sm font-medium text-foreground truncate">
                                  {product.name}
                                </p>
                              )}
                              <p className="text-xs font-semibold text-primary mt-0.5">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                            <ArrowRight
                              size={14}
                              className="flex-shrink-0 text-muted-foreground"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>

                    {/* See all results */}
                    <button
                      onClick={() => handleMobileSearchSelect(mobileSearchQuery.trim())}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary-50 active:scale-[0.98]"
                    >
                      <Search size={14} />
                      Voir tous les résultats
                    </button>
                  </div>
                )}

                {/* No results */}
                {!mobileSuggestionsLoading && mobileSuggestions.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Search size={24} className="text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Aucun produit trouvé
                    </p>
                    <button
                      onClick={() => handleMobileSearchSelect(mobileSearchQuery.trim())}
                      className="mt-1 text-sm font-medium text-primary underline underline-offset-2"
                    >
                      Lancer la recherche complète
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ── Idle mode: Recent + Popular ── */
              <>
                {/* Recent Searches */}
                {mobileRecentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        Recherches récentes
                      </h4>
                      <button
                        onClick={handleMobileClearRecent}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
                        title="Tout effacer"
                        aria-label="Effacer toutes les recherches récentes"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mobileRecentSearches.map((term) => (
                        <span
                          key={term}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3.5 py-2 text-sm font-medium text-foreground/80 transition-all duration-200 hover:border-primary/30 hover:bg-primary-50"
                        >
                          <button
                            onClick={() => handleMobileSearchSelect(term)}
                            className="outline-none"
                          >
                            {term}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMobileRemoveRecent(term);
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors duration-150 outline-none"
                            aria-label={`Supprimer ${term}`}
                          >
                            <X size={14} strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                {popularSearches.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        Recherches populaires
                      </h4>
                      <Sparkles size={14} className="text-accent" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleMobileSearchSelect(term)}
                          className="rounded-full border border-border bg-white px-3.5 py-2 text-sm font-medium text-foreground/80 transition-all duration-200 hover:border-primary/40 hover:bg-primary-50 hover:text-primary active:scale-95"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
