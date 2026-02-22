"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  X,
  Camera,
  Shirt,
  Dumbbell,
  Gem,
  Briefcase,
  Package,
  SprayCan,
  Stethoscope,
  Monitor,
  Baby,
  Scissors,
  ChevronRight,
  Trash2,
  Sparkles,
} from "lucide-react";

/* ── Search data (will come from API later) ── */
const initialRecentSearches = [
  "Boeuf",
  "Riz",
  "Boulangerie fraîche",
  "Poulet grillé",
  "Légumes bio",
];

const popularSearches = [
  "Boeuf",
  "Riz",
  "Boulangerie fraîche",
  "Poulet grillé",
  "Légumes bio",
  "Fruits de mer",
  "Pâtisserie",
  "Produits laitiers",
  "Épices",
  "Boissons fraîches",
];

const navLinks = [
  { label: "Produits", href: "/produits" },
  { label: "Fournisseurs", href: "/fournisseurs" },
  { label: "Actualités", href: "/actualites" },
];

/* ── Mega Menu Data ──────────────────────────────────── */

interface SubCategory {
  name: string;
}

interface CategorySection {
  title: string;
  items: SubCategory[];
}

interface MegaCategory {
  id: number;
  name: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  sections: CategorySection[];
}

const megaCategories: MegaCategory[] = [
  {
    id: 1,
    name: "Tenues de sport et vêtements d'extérieur",
    icon: Shirt,
    sections: [
      {
        title: "Tenues de sport et vêtements d'extérieur",
        items: [
          { name: "Chaussure de basket-ball" },
          { name: "Chaussures de course" },
          { name: "Chaussures pieds nus" },
          { name: "Short de boxe" },
          { name: "Vêtements de cyclisme" },
          { name: "Correcteur de posture" },
          { name: "Chevillère" },
        ],
      },
      {
        title: "Produits de beauté",
        items: [
          { name: "Parfum Femme" },
          { name: "Coffrets Parfums" },
          { name: "Poudre acrylique" },
          { name: "Cosmétique" },
          { name: "Tressage des cheveux" },
          { name: "Cheveux Brésiliens" },
        ],
      },
    ],
  },
  {
    id: 2,
    name: "Produits de beauté",
    icon: SprayCan,
    sections: [
      {
        title: "Produits de beauté",
        items: [
          { name: "Parfum Femme" },
          { name: "Coffrets Parfums" },
          { name: "Poudre acrylique" },
          { name: "Cosmétique" },
          { name: "Extensions cheveux" },
          { name: "Soins de la peau" },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Chaussures & Accessoires",
    icon: Scissors,
    sections: [
      {
        title: "Chaussures & Accessoires",
        items: [
          { name: "Baskets homme" },
          { name: "Sandales femme" },
          { name: "Chaussures de ville" },
          { name: "Bottes" },
          { name: "Mocassins" },
          { name: "Tongs" },
        ],
      },
    ],
  },
  {
    id: 4,
    name: "Parents, Enfants & Jouets",
    icon: Baby,
    sections: [
      {
        title: "Parents, Enfants & Jouets",
        items: [
          { name: "Jouets éducatifs" },
          { name: "Poussettes" },
          { name: "Vêtements bébé" },
          { name: "Jouets en bois" },
          { name: "Figurines" },
          { name: "Jeux de société" },
        ],
      },
    ],
  },
  {
    id: 5,
    name: "Vêtements & Accessoires",
    icon: Shirt,
    sections: [
      {
        title: "Vêtements & Accessoires",
        items: [
          { name: "T-shirts homme" },
          { name: "Robes femme" },
          { name: "Jeans" },
          { name: "Vestes" },
          { name: "Accessoires de mode" },
          { name: "Sous-vêtements" },
        ],
      },
    ],
  },
  {
    id: 6,
    name: "Électronique grand public",
    icon: Monitor,
    sections: [
      {
        title: "Électronique grand public",
        items: [
          { name: "Smartphones" },
          { name: "Tablettes" },
          { name: "Écouteurs sans fil" },
          { name: "Chargeurs" },
          { name: "Coques téléphone" },
          { name: "Accessoires PC" },
        ],
      },
    ],
  },
  {
    id: 7,
    name: "Sports & Loisirs",
    icon: Dumbbell,
    sections: [
      {
        title: "Sports & Loisirs",
        items: [
          { name: "Équipement fitness" },
          { name: "Camping" },
          { name: "Vélos" },
          { name: "Yoga" },
          { name: "Natation" },
          { name: "Randonnée" },
        ],
      },
    ],
  },
  {
    id: 8,
    name: "Bijoux, Lunettes & Montres",
    icon: Gem,
    sections: [
      {
        title: "Bijoux, Lunettes & Montres",
        items: [
          { name: "Colliers" },
          { name: "Bagues" },
          { name: "Montres homme" },
          { name: "Lunettes de soleil" },
          { name: "Bracelets" },
          { name: "Boucles d'oreilles" },
        ],
      },
    ],
  },
  {
    id: 9,
    name: "Bagages, Sacs, Étuis",
    icon: Briefcase,
    sections: [
      {
        title: "Bagages, Sacs, Étuis",
        items: [
          { name: "Valises" },
          { name: "Sacs à dos" },
          { name: "Sacs à main" },
          { name: "Portefeuilles" },
          { name: "Étuis pour tablettes" },
          { name: "Sacs de voyage" },
        ],
      },
    ],
  },
  {
    id: 10,
    name: "Emballage & Impression",
    icon: Package,
    sections: [
      {
        title: "Emballage & Impression",
        items: [
          { name: "Boîtes d'emballage" },
          { name: "Sacs en papier" },
          { name: "Étiquettes" },
          { name: "Ruban adhésif" },
          { name: "Film plastique" },
          { name: "Impression personnalisée" },
        ],
      },
    ],
  },
  {
    id: 11,
    name: "Hygiène perso & Ménage",
    icon: SprayCan,
    sections: [
      {
        title: "Hygiène perso & Ménage",
        items: [
          { name: "Produits nettoyants" },
          { name: "Désinfectants" },
          { name: "Brosses à dents" },
          { name: "Savons" },
          { name: "Détergents" },
          { name: "Éponges" },
        ],
      },
    ],
  },
  {
    id: 12,
    name: "Médical & Santé",
    icon: Stethoscope,
    sections: [
      {
        title: "Médical & Santé",
        items: [
          { name: "Masques chirurgicaux" },
          { name: "Thermomètres" },
          { name: "Tensiomètres" },
          { name: "Gants médicaux" },
          { name: "Oxymètres" },
          { name: "Compléments alimentaires" },
        ],
      },
    ],
  },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(initialRecentSearches);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number>(1);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const megaMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeCategory = megaCategories.find((c) => c.id === activeCategoryId) || megaCategories[0];

  /* ── Recent search handlers ── */
  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => prev.filter((s) => s !== term));
  }, []);

  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const handleSearchSelect = useCallback((term: string) => {
    setSearchQuery(term);
    setSearchFocused(false);
    setMobileSearchOpen(false);
    // TODO: navigate to search results
  }, []);

  /* ── Mobile search open effect ── */
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
    // Lock body scroll when mobile search is open
    if (mobileSearchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSearchOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMegaMenuEnter = () => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setMegaMenuOpen(true);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 200);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "shadow-lg" : "shadow-sm"
      }`}
    >
      {/* ── Main Header Bar (Orange) ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #F15412 0%, #E84D0E 50%, #D4450B 100%)",
        }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-2.5 lg:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl transition-transform duration-300 group-hover:scale-110 bg-white/10 p-0.5">
              <Image src="/logo.png" alt="Sugu" fill className="object-contain" />
            </div>
          </a>

          {/* Hamburger + "Toutes les catégories" */}
          <div
            className="relative flex-shrink-0"
            onMouseEnter={handleMegaMenuEnter}
            onMouseLeave={handleMegaMenuLeave}
          >
            <button className="hidden lg:flex items-center gap-2 text-white/90 hover:text-white transition-colors duration-200">
              <Menu size={20} />
              <span className="text-sm font-semibold whitespace-nowrap">Toutes les catégories</span>
            </button>
          </div>

          {/* Search Bar — Desktop */}
          <div ref={searchRef} className="relative flex-1 max-w-xl hidden md:block">
            <div className="flex items-center">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="Rechercher par nom de produit"
                  className="w-full rounded-l-full border-2 border-r-0 border-white/20 bg-white pl-11 pr-5 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-white/40 transition-all duration-200"
                />
              </div>
              <button className="flex items-center gap-1.5 rounded-r-full bg-[#F5C451] px-5 py-2.5 border-2 border-[#F5C451] text-sm font-bold text-gray-900 transition-all duration-200 hover:bg-[#f0bb3a] active:scale-95 whitespace-nowrap">
                Rechercher
              </button>
            </div>

            {/* Search dropdown — Desktop */}
            {searchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white border border-gray-100 shadow-2xl p-5 z-50 animate-fade-slide-down">
                {/* Recent Search */}
                {recentSearches.length > 0 && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900">Recherches récentes</h4>
                      <button
                        onClick={clearAllRecentSearches}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                        title="Tout effacer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term) => (
                        <span
                          key={term}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:border-[#F15412]/30 hover:bg-[#F15412]/5"
                        >
                          <button onClick={() => handleSearchSelect(term)} className="outline-none">
                            {term}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(term);
                            }}
                            className="text-gray-400 hover:text-[#F15412] transition-colors duration-150 outline-none"
                          >
                            <X size={13} strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Search */}
                <div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Recherches populaires</h4>
                    <Sparkles size={14} className="text-[#F5C451]" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearchSelect(term)}
                        className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-all duration-200 hover:border-[#F15412]/40 hover:bg-[#F15412]/5 hover:text-[#F15412]"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-5 flex-shrink-0">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-white/85 transition-all duration-200 hover:text-white whitespace-nowrap"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Mobile search trigger */}
            <button
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search size={20} />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white">
              <User size={20} />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white">
              <Heart size={20} />
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-all duration-200 hover:bg-white/15 hover:text-white">
              <ShoppingCart size={20} />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F5C451] text-[9px] font-bold text-gray-900">
                3
              </span>
            </button>
            <button
              className="ml-1 flex lg:hidden items-center justify-center rounded-lg p-2 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mega Menu Dropdown ── */}
      {megaMenuOpen && (
        <div
          ref={megaMenuRef}
          className="absolute left-0 right-0 top-full z-50 hidden lg:block"
          onMouseEnter={handleMegaMenuEnter}
          onMouseLeave={handleMegaMenuLeave}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 top-0 bg-black/20 -z-10" onClick={() => setMegaMenuOpen(false)} />

          <div className="mx-auto max-w-[1400px] px-4 lg:px-8">
            <div className="flex bg-white rounded-b-2xl shadow-2xl border border-t-0 border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Left sidebar — category list */}
              <div className="w-[260px] flex-shrink-0 border-r border-gray-100 bg-gray-50/50 py-2 max-h-[480px] overflow-y-auto">
                {megaCategories.map((cat) => {
                  const IconComp = cat.icon;
                  const isActive = cat.id === activeCategoryId;
                  return (
                    <button
                      key={cat.id}
                      onMouseEnter={() => setActiveCategoryId(cat.id)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-all duration-150 ${
                        isActive
                          ? "bg-white text-[#F15412] border-l-[3px] border-[#F15412] font-semibold"
                          : "text-gray-700 border-l-[3px] border-transparent hover:bg-white/70 hover:text-[#F15412]"
                      }`}
                    >
                      <IconComp size={16} strokeWidth={1.5} className="flex-shrink-0" />
                      <span className="text-sm leading-snug">{cat.name}</span>
                      <ChevronRight size={14} className="ml-auto text-gray-300 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* Right content — subcategories grid */}
              <div className="flex-1 p-6 max-h-[480px] overflow-y-auto">
                {activeCategory.sections.map((section, sIdx) => (
                  <div key={sIdx} className={sIdx > 0 ? "mt-8" : ""}>
                    {/* Section header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-gray-900">{section.title}</h3>
                      <button className="text-xs font-medium text-[#F15412] hover:underline whitespace-nowrap italic">
                        Parcourir les sélections en vedette
                      </button>
                    </div>

                    {/* Items grid */}
                    <div className="grid grid-cols-5 xl:grid-cols-7 gap-4">
                      {section.items.map((item, iIdx) => (
                        <a
                          key={iIdx}
                          href="#"
                          className="group flex flex-col items-center gap-2 text-center"
                        >
                          <div className="w-[72px] h-[72px] rounded-full bg-gray-100 flex items-center justify-center transition-all duration-200 group-hover:bg-[#F15412]/10 group-hover:shadow-md">
                            <Camera size={22} className="text-gray-300 group-hover:text-[#F15412] transition-colors duration-200" />
                          </div>
                          <span className="text-[11px] leading-tight text-gray-600 group-hover:text-[#F15412] transition-colors duration-200 max-w-[90px]">
                            {item.name}
                          </span>
                        </a>
                      ))}
                      {/* "Voir plus" link */}
                      <a
                        href="#"
                        className="group flex flex-col items-center gap-2 text-center"
                      >
                        <div className="w-[72px] h-[72px] rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center transition-all duration-200 group-hover:border-[#F15412]/40 group-hover:bg-[#F15412]/5">
                          <span className="text-xs font-semibold text-gray-400 group-hover:text-[#F15412] transition-colors duration-200">
                            Voir plus
                          </span>
                        </div>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Menu (nav links only) ── */}
      <div
        className={`overflow-hidden transition-all duration-300 bg-white md:hidden ${
          mobileMenuOpen ? "max-h-60 px-4 pb-3" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col gap-1 pt-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-[#F15412]/5 hover:text-[#F15412] transition-colors duration-200"
            >
              {link.label}
            </a>
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
            >
              <X size={22} />
            </button>
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom de produit"
                className="w-full rounded-full bg-gray-800 pl-9 pr-4 py-2 text-sm text-white outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-white/20 transition-all duration-200"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {/* Recent Search */}
            {recentSearches.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Recherches récentes</h4>
                  <button
                    onClick={clearAllRecentSearches}
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
                    title="Tout effacer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <span
                      key={term}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-[#F15412]/30 hover:bg-[#F15412]/5"
                    >
                      <button onClick={() => handleSearchSelect(term)} className="outline-none">
                        {term}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch(term);
                        }}
                        className="text-gray-400 hover:text-[#F15412] transition-colors duration-150 outline-none"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Search */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <h4 className="text-sm font-semibold text-gray-900">Recherches populaires</h4>
                <Sparkles size={14} className="text-[#F5C451]" />
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearchSelect(term)}
                    className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-[#F15412]/40 hover:bg-[#F15412]/5 hover:text-[#F15412] active:scale-95"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
