import type {
  ApiProductDetail,
  ApiStock,
  ApiVariant,
} from "../api/product-detail.schemas";

/**
 * Resolve the concrete API variant used for price, stock and MOQ.
 *
 * Simple products still have one technical variant in the backend even when
 * they expose no selectable options. That variant must remain resolvable or
 * the UI falls back to the product snapshot and can lose the exact stock.
 */
export function resolveApiVariant(
  apiData: ApiProductDetail | undefined,
  selectedVariants: Record<string, string>
): ApiVariant | null {
  if (!apiData?.variants.length) return null;

  if (!apiData.options.length) {
    if (apiData.has_variants) return null;

    return apiData.variants.find(
      (variant) =>
        String(variant.id) === String(apiData.default_variant_id) &&
        variant.stock.in_stock
    ) ?? apiData.variants.find((variant) => variant.stock.in_stock)
      ?? apiData.variants.find(
        (variant) => String(variant.id) === String(apiData.default_variant_id)
      )
      ?? (apiData.variants.length === 1 ? apiData.variants[0] : null);
  }

  const selectionMap: Record<string, string> = {};
  for (const option of apiData.options) {
    const selectedOptionId = selectedVariants[String(option.id)];
    if (selectedOptionId !== undefined) {
      const value = option.values.find(
        (candidate) => String(candidate.id) === selectedOptionId
      );
      if (value) selectionMap[option.name] = value.label;
    }
  }

  if (Object.keys(selectionMap).length !== apiData.options.length) {
    return null;
  }

  return apiData.variants.find((variant) =>
    apiData.options.every(
      (option) => variant.option_values[option.name] === selectionMap[option.name]
    )
  ) ?? null;
}

/**
 * The legacy UI model requires a number. Preserve sellability when the
 * centralized backend intentionally returns an unknown quantity (`null`) with
 * `in_stock=true`; the cart API remains the final stock authority.
 */
export function toLegacyStockQuantity(stock: ApiStock): number {
  return stock.quantity_available ?? (stock.in_stock ? 1 : 0);
}

export function isStockQuantityUnknown(
  apiData: ApiProductDetail | undefined
): boolean {
  return Boolean(
    apiData
    && apiData.stock.quantity_available === null
    && apiData.stock.in_stock
    && !apiData.stock.is_unlimited
  );
}
