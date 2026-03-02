/**
 * Checkout Query Functions — entry points for pages.
 *
 * SSR-compatible. Uses cache: "no-store" since checkout is user-specific.
 * Called by the Server Component page, passes data to client orchestrator.
 */

import { getCheckoutSession, getShippingOptions } from "../api/checkout.api";
import type { CheckoutSessionApi, DeliveryPartner, DeliveryZone } from "../api/checkout.types";

// ─── Types for the page ──────────────────────────────────────

export interface CheckoutQueryResult {
  session: CheckoutSessionApi;
  partners: DeliveryPartner[];
  zones: DeliveryZone[];
  error: string | null;
}

/**
 * Load checkout session + shipping options in parallel.
 * Called from the server component with `session=...` query param.
 *
 * If the session is invalid/expired, returns error message instead of throwing
 * (so the page can show a friendly error).
 */
export async function queryCheckoutSession(
  sessionId: string
): Promise<CheckoutQueryResult> {
  try {
    // Parallel fetch: session + shipping options
    const [session, shipping] = await Promise.all([
      getCheckoutSession(sessionId),
      getShippingOptions("BF").catch(() => ({ partners: [], zones: [] })),
    ]);

    return {
      session,
      partners: shipping.partners,
      zones: shipping.zones,
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Impossible de charger la session de paiement.";

    return {
      session: null as unknown as CheckoutSessionApi,
      partners: [],
      zones: [],
      error: message,
    };
  }
}
