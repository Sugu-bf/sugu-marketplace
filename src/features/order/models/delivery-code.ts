import { z } from "zod";

/**
 * Code de confirmation de livraison — contrat de `GET orders/{id}/delivery-code`.
 *
 * Le code que le client donne au livreur au moment de la remise. Le serveur
 * décide seul s'il peut être lu (livreur en route, produits payés pour un
 * COD Mixte) : `code` est nul tant que `state` n'est pas `available`, et
 * `message` dit pourquoi.
 */
export const DELIVERY_CODE_STATES = [
  "available",
  "not_issued",
  "not_on_the_way",
  "product_payment_pending",
  "delivered",
  "failed",
  "order_closed",
] as const;

export type DeliveryCodeState = (typeof DELIVERY_CODE_STATES)[number];

export const DeliveryCodeEntrySchema = z.object({
  shipment_id: z.string(),
  // Un état que cette version ne connaît pas reste lisible : son message s'affiche.
  state: z.string(),
  code: z.string().nullable(),
  message: z.string(),
});

export const DeliveryCodeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    order_id: z.string(),
    deliveries: z.array(DeliveryCodeEntrySchema),
  }),
});

export interface DeliveryCodeEntry {
  shipmentId: string;
  state: DeliveryCodeState | "unknown";
  /** Jamais renseigné hors de l'état `available`. */
  code: string | null;
  message: string;
}

const KNOWN_STATES = new Set<string>(DELIVERY_CODE_STATES);

export function mapDeliveryCodeEntry(
  entry: z.infer<typeof DeliveryCodeEntrySchema>
): DeliveryCodeEntry {
  const state = KNOWN_STATES.has(entry.state)
    ? (entry.state as DeliveryCodeState)
    : "unknown";
  const code = entry.code?.trim() ?? "";

  return {
    shipmentId: entry.shipment_id,
    state,
    // Un code n'est montré que si le serveur dit qu'il peut l'être.
    code: state === "available" && code !== "" ? code : null,
    message: entry.message,
  };
}

/** Plus rien à attendre du code : la livraison est faite ou la commande close. */
export function isDeliveryCodeSettled(entries: DeliveryCodeEntry[]): boolean {
  return (
    entries.length > 0 &&
    entries.every((e) => e.state === "delivered" || e.state === "order_closed")
  );
}
