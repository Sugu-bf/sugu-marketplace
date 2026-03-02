/**
 * URL state management for the store product listing.
 *
 * The BFF uses cursor-based pagination (not offset/page).
 * Query params are synced with the URL for SEO and shareability.
 */

// ─── Types ───────────────────────────────────────────────────

export interface StoreListingState {
  sort: "popular" | "newest" | "price_asc" | "price_desc" | "top_rated";
  q: string;
  cursor: string | null;
  view: "grid" | "list";
}

const VALID_SORTS = [
  "popular",
  "newest",
  "price_asc",
  "price_desc",
  "top_rated",
] as const;

const DEFAULT_STATE: StoreListingState = {
  sort: "popular",
  q: "",
  cursor: null,
  view: "grid",
};

// ─── Parse from searchParams ─────────────────────────────────

export function parseStoreSearchParams(
  sp: Record<string, string | string[] | undefined>,
): StoreListingState {
  return {
    sort: isValidSort(sp.sort) ? sp.sort : DEFAULT_STATE.sort,
    q: typeof sp.q === "string" ? sp.q : "",
    cursor: typeof sp.cursor === "string" ? sp.cursor : null,
    view: sp.view === "list" ? "list" : "grid",
  };
}

// ─── Serialize to URLSearchParams ────────────────────────────

export function serializeStoreListingState(
  state: Partial<StoreListingState>,
): URLSearchParams {
  const params = new URLSearchParams();

  // Stable order for SEO
  if (state.q) params.set("q", state.q);
  if (state.sort && state.sort !== DEFAULT_STATE.sort)
    params.set("sort", state.sort);
  if (state.cursor) params.set("cursor", state.cursor);
  if (state.view && state.view !== DEFAULT_STATE.view)
    params.set("view", state.view);

  return params;
}

// ─── Build URL path for router.push ──────────────────────────

export function buildStoreListingUrl(
  slug: string,
  state: Partial<StoreListingState>,
): string {
  const params = serializeStoreListingState(state);
  const qs = params.toString();
  return qs ? `/store/${slug}?${qs}` : `/store/${slug}`;
}

// ─── Defaults ────────────────────────────────────────────────

export { DEFAULT_STATE as STORE_LISTING_DEFAULTS };

// ─── Validation ──────────────────────────────────────────────

function isValidSort(
  v: unknown,
): v is StoreListingState["sort"] {
  return (
    typeof v === "string" &&
    (VALID_SORTS as readonly string[]).includes(v)
  );
}
