/**
 * URL state management for the supplier listing page.
 */

// ─── Types ───────────────────────────────────────────────────

export interface SupplierListingState {
  sort: "popular" | "newest" | "top_rated";
  q: string;
  cursor: string | null;
}

const VALID_SORTS = ["popular", "newest", "top_rated"] as const;

const DEFAULT_STATE: SupplierListingState = {
  sort: "popular",
  q: "",
  cursor: null,
};

// ─── Parse from searchParams ─────────────────────────────────

export function parseSupplierSearchParams(
  sp: Record<string, string | string[] | undefined>,
): SupplierListingState {
  return {
    sort: isValidSort(sp.sort) ? sp.sort : DEFAULT_STATE.sort,
    q: typeof sp.q === "string" ? sp.q : "",
    cursor: typeof sp.cursor === "string" ? sp.cursor : null,
  };
}

// ─── Serialize to URLSearchParams ────────────────────────────

export function serializeSupplierListingState(
  state: Partial<SupplierListingState>,
): URLSearchParams {
  const params = new URLSearchParams();

  if (state.q) params.set("q", state.q);
  if (state.sort && state.sort !== DEFAULT_STATE.sort)
    params.set("sort", state.sort);
  if (state.cursor) params.set("cursor", state.cursor);

  return params;
}

// ─── Build URL path for router.push ──────────────────────────

export function buildSupplierListingUrl(
  state: Partial<SupplierListingState>,
): string {
  const params = serializeSupplierListingState(state);
  const qs = params.toString();
  return qs ? `/fournisseurs?${qs}` : `/fournisseurs`;
}

// ─── Defaults ────────────────────────────────────────────────

export { DEFAULT_STATE as SUPPLIER_LISTING_DEFAULTS };

// ─── Validation ──────────────────────────────────────────────

function isValidSort(
  v: unknown,
): v is SupplierListingState["sort"] {
  return (
    typeof v === "string" &&
    (VALID_SORTS as readonly string[]).includes(v)
  );
}
