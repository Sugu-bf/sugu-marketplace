"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isApiError } from "@/lib/api";
import { queryDeliveryCode } from "../queries/order-queries";
import { isDeliveryCodeSettled } from "../models/delivery-code";
import type { DeliveryCodeEntry } from "../models/delivery-code";

/** Le code n'apparaît qu'au départ du livreur : on le redemande tant qu'il peut changer. */
const REFRESH_INTERVAL = 20_000;

/**
 * Au-delà de cet âge, une réponse ne prouve plus rien : deux vérifications
 * ont manqué (onglet en arrière-plan, appareil en veille, requête en panne).
 */
export const MAX_VERIFIED_AGE = 2 * REFRESH_INTERVAL + 5_000;

export type DeliveryCodeProblem = "sign_in" | "not_yours" | "unverified";

/**
 * Code de confirmation de livraison du client.
 *
 * Un code n'est rendu que s'il vient d'être confirmé par le serveur. Dès
 * que cette confirmation manque — la requête échoue, l'appareil est hors
 * ligne, la dernière réponse est trop ancienne — plus rien de ce qui a été
 * lu n'est rendu : ni le code, ni l'état. Les conditions de sa révélation
 * (livreur en route, produits payés, commande non remise) ne peuvent plus
 * être affirmées.
 *
 * `signal` résume l'état de la commande tel que le suivi le connaît (statut,
 * paiement, livreur). Il fait partie de la clé : dès que la commande change,
 * la réponse précédente est abandonnée et le code est redemandé. Rien n'est
 * gardé en cache après le démontage (`gcTime: 0`), ni ailleurs dans le
 * navigateur.
 */
export function useDeliveryCode(orderId: string, signal: string) {
  const query = useQuery<DeliveryCodeEntry[]>({
    queryKey: ["order", orderId, "delivery-code", signal],
    queryFn: () => queryDeliveryCode(orderId),
    staleTime: 0,
    gcTime: 0,
    // Hors ligne, la requête échoue au lieu d'attendre en silence avec l'ancienne réponse à l'écran.
    networkMode: "always",
    // Un refus (401, 404) ne se rejoue pas ; une coupure, une fois : un réseau instable n'efface pas le code au premier accroc.
    retry: (failures, error) =>
      !(isApiError(error) && error.isClientError) && failures < 1,
    refetchInterval: (q) =>
      q.state.data && isDeliveryCodeSettled(q.state.data) ? false : REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const settled = !!query.data && isDeliveryCodeSettled(query.data);
  const now = useNow(5_000, !settled);
  // Une livraison terminée ne change plus : sa réponse ne vieillit pas.
  const outdated =
    !settled && query.dataUpdatedAt > 0 && now - query.dataUpdatedAt > MAX_VERIFIED_AGE;

  const { refetch, isFetching } = query;
  useEffect(() => {
    if (outdated && !isFetching) void refetch();
  }, [outdated, isFetching, refetch]);

  const problem: DeliveryCodeProblem | null = !query.error
    ? null
    : isApiError(query.error) && query.error.status === 401
      ? "sign_in"
      : isApiError(query.error) && (query.error.status === 403 || query.error.status === 404)
        ? "not_yours"
        : "unverified";

  return {
    // Seulement ce que le serveur vient de confirmer.
    deliveries: problem || outdated ? undefined : query.data,
    // Première lecture, ou relecture d'une réponse trop ancienne.
    isLoading: query.isPending || (outdated && !problem),
    isRetrying: query.isFetching && problem === "unverified",
    problem,
    retry: () => {
      void query.refetch();
    },
  };
}

/** L'heure, relue à intervalle régulier et au retour sur l'onglet. */
function useNow(interval: number, enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, interval);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [interval, enabled]);

  return now;
}
