"use client";

import { useQuery } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";
import { queryDeliveryCode } from "../queries/order-queries";
import { isDeliveryCodeSettled } from "../models/delivery-code";
import type { DeliveryCodeEntry } from "../models/delivery-code";

/** Le code n'apparaît qu'au départ du livreur : on le redemande tant qu'il peut changer. */
const REFRESH_INTERVAL = 20_000;

export type DeliveryCodeProblem = "sign_in" | "not_yours" | "network";

/**
 * Code de confirmation de livraison du client.
 *
 * `signal` résume l'état de la commande tel que le suivi le connaît (statut,
 * paiement, livreur). Il fait partie de la clé : dès que la commande change,
 * la réponse précédente est abandonnée et le code est redemandé — un code
 * d'un état passé ne reste jamais à l'écran. Rien n'est gardé en cache après
 * le démontage (`gcTime: 0`).
 */
export function useDeliveryCode(orderId: string, signal: string) {
  const query = useQuery<DeliveryCodeEntry[]>({
    queryKey: ["order", orderId, "delivery-code", signal],
    queryFn: () => queryDeliveryCode(orderId),
    staleTime: 0,
    gcTime: 0,
    // Un refus (401, 404) ne se rejoue pas ; une coupure, une fois.
    retry: (failures, error) =>
      !(isApiError(error) && error.isClientError) && failures < 1,
    refetchInterval: (q) =>
      q.state.data && isDeliveryCodeSettled(q.state.data) ? false : REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const problem: DeliveryCodeProblem | null = !query.error
    ? null
    : isApiError(query.error) && query.error.status === 401
      ? "sign_in"
      : isApiError(query.error) && (query.error.status === 403 || query.error.status === 404)
        ? "not_yours"
        : "network";

  return {
    // Après un refus, plus rien de ce qui a été lu ne s'affiche.
    deliveries: problem === "sign_in" || problem === "not_yours" ? undefined : query.data,
    isLoading: query.isPending,
    isRefreshing: query.isFetching && !query.isPending,
    problem,
    retry: () => {
      void query.refetch();
    },
  };
}
