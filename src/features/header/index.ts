/**
 * Header feature — barrel export.
 *
 * Public API for the header domain.
 */

// ─── Components ──────────────────────────────────────────────
export { default as MarketplaceHeader } from "./components/MarketplaceHeader";
export { default as MarketplaceHeaderClient } from "./components/MarketplaceHeaderClient";
export { default as CategoriesMegaMenu } from "./components/CategoriesMegaMenu";
export { default as SearchBar } from "./components/SearchBar";
export { default as SearchDropdown } from "./components/SearchDropdown";
export { default as WishlistDropdown } from "./components/WishlistDropdown";
export { default as CartDropdown } from "./components/CartDropdown";
export { HeaderSkeleton, CartDropdownSkeleton, WishlistDropdownSkeleton } from "./components/HeaderSkeletons";

// ─── API ─────────────────────────────────────────────────────
export {
  fetchCategoriesTree,
  derivePopularSearches,
  fetchCartPreview,
  fetchCartCount,
  fetchWishlistPreview,
  fetchWishlistCount,
} from "./api/header.api";

// ─── Schemas ─────────────────────────────────────────────────
export type {
  HeaderCategory,
  CartPreviewItem,
  CartPreviewTotals,
  WishlistPreviewItem,
} from "./api/header.schemas";

// ─── State ───────────────────────────────────────────────────
export {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from "./state/recentSearches.cookie";
